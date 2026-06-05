# -*- coding: utf-8 -*-
# Part of orbex. See LICENSE file for full copyright and licensing details.

__all__ = [
    'convert_file', 'convert_sql_import',
    'convert_csv_import', 'convert_xml_import',
    'convert_json_import', 'convert_html_import',
]
import base64
import csv
import io
import json
import logging
import os.path
import pprint
import re
import subprocess
import warnings
from datetime import datetime, timedelta
from typing import Literal, Optional

from dateutil.relativedelta import relativedelta
from lxml import etree, builder
try:
    import jingtrang
except ImportError:
    jingtrang = None

from .config import config
from .misc import file_open, file_path, SKIPPED_ELEMENT_TYPES
from orbex.exceptions import ValidationError

from .safe_eval import safe_eval, pytz, time

_logger = logging.getLogger(__name__)

ConvertMode = Literal['init', 'update']
IdRef = dict[str, int | Literal[False]]

class ParseError(Exception):
    ...


def _ensure_list(value, label):
    if value is None:
        return []
    if isinstance(value, list):
        return value
    raise ParseError(f"{label} must be a list, got {type(value).__name__}")


def _get_eval_context(self, env, model_str):
    from orbex import fields, release  # noqa: PLC0415
    context = dict(Command=fields.Command,
                  time=time,
                  DateTime=datetime,
                  datetime=datetime,
                  timedelta=timedelta,
                  relativedelta=relativedelta,
                  version=release.major_version,
                  ref=self.id_get,
                  pytz=pytz)
    if model_str:
        context['obj'] = env[model_str].browse
    return context

def _fix_multiple_roots(node):
    """
    Surround the children of the ``node`` element of an XML field with a
    single root "data" element, to prevent having a document with multiple
    roots once parsed separately.

    XML nodes should have one root only, but we'd like to support
    direct multiple roots in our partial documents (like inherited view architectures).
    As a convention we'll surround multiple root with a container "data" element, to be
    ignored later when parsing.
    """
    real_nodes = [x for x in node if not isinstance(x, SKIPPED_ELEMENT_TYPES)]
    if len(real_nodes) > 1:
        data_node = etree.Element("data")
        for child in node:
            data_node.append(child)
        node.append(data_node)

def _eval_xml(self, node, env):
    if node.tag in ('field','value'):
        t = node.get('type','char')
        f_model = node.get('model')
        if f_search := node.get('search'):
            f_use = node.get("use",'id')
            f_name = node.get("name")
            context = _get_eval_context(self, env, f_model)
            q = safe_eval(f_search, context)
            ids = env[f_model].search(q).ids
            if f_use != 'id':
                ids = [x[f_use] for x in env[f_model].browse(ids).read([f_use])]
            _fields = env[f_model]._fields
            if (f_name in _fields) and _fields[f_name].type == 'many2many':
                return ids
            f_val = False
            if len(ids):
                f_val = ids[0]
                if isinstance(f_val, tuple):
                    f_val = f_val[0]
            return f_val
        if a_eval := node.get('eval'):
            context = _get_eval_context(self, env, f_model)
            try:
                return safe_eval(a_eval, context)
            except Exception:
                logging.getLogger('orbex.tools.convert.init').error(
                    'Could not eval(%s) for %s in %s', a_eval, node.get('name'), env.context)
                raise
        def _process(s):
            matches = re.finditer(br'[^%]%\((.*?)\)[ds]'.decode('utf-8'), s)
            done = set()
            for m in matches:
                found = m.group()[1:]
                if found in done:
                    continue
                done.add(found)
                rec_id = m[1]
                xid = self.make_xml_id(rec_id)
                if (record_id := self.idref.get(xid)) is None:
                    record_id = self.idref[xid] = self.id_get(xid)
                # So funny story: in Python 3, bytes(n: int) returns a
                # bytestring of n nuls. In Python 2 it obviously returns the
                # stringified number, which is what we're expecting here
                s = s.replace(found, str(record_id))
            s = s.replace('%%', '%') # Quite weird but it's for (somewhat) backward compatibility sake
            return s

        if t == 'xml':
            _fix_multiple_roots(node)
            return '<?xml version="1.0"?>\n'\
                +_process("".join(etree.tostring(n, encoding='unicode') for n in node))
        if t == 'html':
            return _process("".join(etree.tostring(n, method='html', encoding='unicode') for n in node))

        if node.get('file'):
            if t == 'base64':
                with file_open(node.get('file'), 'rb', env=env) as f:
                    return base64.b64encode(f.read())

            with file_open(node.get('file'), env=env) as f:
                data = f.read()
        else:
            data = node.text or ''

        match t:
            case 'file':
                path = data.strip()
                try:
                    file_path(os.path.join(self.module, path))
                except FileNotFoundError:
                    raise FileNotFoundError(
                        f"No such file or directory: {path!r} in {self.module}"
                    ) from None
                return '%s,%s' % (self.module, path)
            case 'char':
                return data
            case 'int':
                d = data.strip()
                if d == 'None':
                    return None
                return int(d)
            case 'float':
                return float(data.strip())
            case 'list':
                return [_eval_xml(self, n, env) for n in node.iterchildren('value')]
            case 'tuple':
                return tuple(_eval_xml(self, n, env) for n in node.iterchildren('value'))
            case 'base64':
                raise ValueError("base64 type is only compatible with file data")
            case t:
                raise ValueError(f"Unknown type {t!r}")

    elif node.tag == "function":
        from orbex.models import BaseModel  # noqa: PLC0415
        model_str = node.get('model')
        model = env[model_str]
        method_name = node.get('name')
        # determine arguments
        args = []
        kwargs = {}

        if a_eval := node.get('eval'):
            context = _get_eval_context(self, env, model_str)
            args = list(safe_eval(a_eval, context))
        for child in node:
            if child.tag == 'value' and child.get('name'):
                kwargs[child.get('name')] = _eval_xml(self, child, env)
            else:
                args.append(_eval_xml(self, child, env))
        # merge current context with context in kwargs
        if 'context' in kwargs:
            model = model.with_context(**kwargs.pop('context'))
        method = getattr(model, method_name)
        is_model_method = getattr(method, '_api_model', False)
        if is_model_method:
            pass  # already bound to an empty recordset
        else:
            record_ids, *args = args
            model = model.browse(record_ids)
            method = getattr(model, method_name)
        # invoke method
        result = method(*args, **kwargs)
        if isinstance(result, BaseModel):
            result = result.ids
        return result
    elif node.tag == "test":
        return node.text


def str2bool(value):
    return value.lower() not in ('0', 'false', 'off')

def nodeattr2bool(node, attr, default=False):
    if not node.get(attr):
        return default
    val = node.get(attr).strip()
    if not val:
        return default
    return str2bool(val)

class xml_import(object):
    def get_env(self, node, eval_context=None):
        uid = node.get('uid')
        context = node.get('context')
        if uid or context:
            return self.env(
                user=uid and self.id_get(uid),
                context=context and {
                    **self.env.context,
                    **safe_eval(context, {
                        'ref': self.id_get,
                        **(eval_context or {})
                    }),
                }
            )
        return self.env

    def make_xml_id(self, xml_id):
        if not xml_id or '.' in xml_id:
            return xml_id
        return "%s.%s" % (self.module, xml_id)

    def _test_xml_id(self, xml_id):
        if '.' in xml_id:
            module, id = xml_id.split('.', 1)
            assert '.' not in id, """The ID reference "%s" must contain
maximum one dot. They are used to refer to other modules ID, in the
form: module.record_id""" % (xml_id,)
            if module != self.module:
                modcnt = self.env['ir.module.module'].search_count([('name', '=', module), ('state', '=', 'installed')])
                assert modcnt == 1, """The ID "%s" refers to an uninstalled module""" % (xml_id,)

    def _tag_delete(self, rec):
        d_model = rec.get("model")
        records = self.env[d_model]

        if d_search := rec.get("search"):
            context = _get_eval_context(self, self.env, d_model)
            try:
                records = records.search(safe_eval(d_search, context))
            except ValueError:
                _logger.warning('Skipping deletion for failed search `%r`', d_search, exc_info=True)

        if d_id := rec.get("id"):
            try:
                records += records.browse(self.id_get(d_id))
            except ValueError:
                # d_id cannot be found. doesn't matter in this case
                _logger.warning('Skipping deletion for missing XML ID `%r`', d_id, exc_info=True)

        if records:
            records.unlink()

    def _tag_function(self, rec):
        if self.noupdate and self.mode != 'init':
            return
        env = self.get_env(rec)
        _eval_xml(self, rec, env)

    def _tag_menuitem(self, rec, parent=None):
        rec_id = rec.attrib["id"]
        self._test_xml_id(rec_id)

        # The parent attribute was specified, if non-empty determine its ID, otherwise
        # explicitly make a top-level menu
        values = {
            'parent_id': False,
            'active': nodeattr2bool(rec, 'active', default=True),
        }

        if rec.get('sequence'):
            values['sequence'] = int(rec.get('sequence'))

        if parent is not None:
            values['parent_id'] = parent
        elif rec.get('parent'):
            values['parent_id'] = self.id_get(rec.attrib['parent'])
        elif rec.get('web_icon'):
            values['web_icon'] = rec.attrib['web_icon']


        if rec.get('name'):
            values['name'] = rec.attrib['name']

        if rec.get('action'):
            a_action = rec.attrib['action']

            if '.' not in a_action:
                a_action = '%s.%s' % (self.module, a_action)
            act = self.env.ref(a_action).sudo()
            values['action'] = "%s,%d" % (act.type, act.id)

            if not values.get('name') and act.type.endswith(('act_window', 'wizard', 'url', 'client', 'server')) and act.name:
                values['name'] = act.name

        if not values.get('name'):
            values['name'] = rec_id or '?'

        from orbex.fields import Command  # noqa: PLC0415
        groups = []
        for group in rec.get('groups', '').split(','):
            if group.startswith('-'):
                group_id = self.id_get(group[1:])
                groups.append(Command.unlink(group_id))
            elif group:
                group_id = self.id_get(group)
                groups.append(Command.link(group_id))
        if groups:
            values['group_ids'] = groups


        data = {
            'xml_id': self.make_xml_id(rec_id),
            'values': values,
            'noupdate': self.noupdate,
        }
        menu = self.env['ir.ui.menu']._load_records([data], self.mode == 'update')
        for child in rec.iterchildren('menuitem'):
            self._tag_menuitem(child, parent=menu.id)

    def _tag_record(self, rec, extra_vals=None):
        rec_model = rec.get("model")
        env = self.get_env(rec)
        rec_id = rec.get("id", '')

        model = env[rec_model]

        if self.xml_filename and rec_id:
            model = model.with_context(
                install_mode=True,
                install_module=self.module,
                install_filename=self.xml_filename,
                install_xmlid=rec_id,
            )

        self._test_xml_id(rec_id)
        xid = self.make_xml_id(rec_id)

        # in update mode, the record won't be updated if the data node explicitly
        # opt-out using @noupdate="1". A second check will be performed in
        # model._load_records() using the record's ir.model.data `noupdate` field.
        if self.noupdate and self.mode != 'init':
            # check if the xml record has no id, skip
            if not rec_id:
                return None

            if record := env['ir.model.data']._load_xmlid(xid):
                for child in rec.xpath('.//record[@id]'):
                    sub_xid = child.get("id")
                    self._test_xml_id(sub_xid)
                    sub_xid = self.make_xml_id(sub_xid)
                    if sub_record := env['ir.model.data']._load_xmlid(sub_xid):
                        self.idref[sub_xid] = sub_record.id

                # if the resource already exists, don't update it but store
                # its database id (can be useful)
                self.idref[xid] = record.id
                return None
            elif not nodeattr2bool(rec, 'forcecreate', True):
                # if it doesn't exist and we shouldn't create it, skip it
                return None
            # else create it normally

        foreign_record_to_create = False
        if xid and xid.partition('.')[0] != self.module:
            # updating a record created by another module
            record = self.env['ir.model.data']._load_xmlid(xid)
            if not record and not (foreign_record_to_create := nodeattr2bool(rec, 'forcecreate')):  # Allow foreign records if explicitely stated
                if self.noupdate and not nodeattr2bool(rec, 'forcecreate', True):
                    # if it doesn't exist and we shouldn't create it, skip it
                    return None
                raise Exception("Cannot update missing record %r" % xid)

        from orbex.fields import Command  # noqa: PLC0415
        res = {}
        sub_records = []
        for field in rec.iterchildren('field'):
            #TODO: most of this code is duplicated above (in _eval_xml)...
            f_name = field.get("name")
            if '@' in f_name:
                continue  # used for translations
            f_model = field.get("model")
            if not f_model and f_name in model._fields:
                f_model = model._fields[f_name].comodel_name
            f_use = field.get("use",'') or 'id'
            f_val = False

            if f_search := field.get("search"):
                context = _get_eval_context(self, env, f_model)
                q = safe_eval(f_search, context)
                assert f_model, 'Define an attribute model="..." in your .XML file!'
                # browse the objects searched
                s = env[f_model].search(q)
                # column definitions of the "local" object
                _fields = env[rec_model]._fields
                # if the current field is many2many
                if (f_name in _fields) and _fields[f_name].type == 'many2many':
                    f_val = [Command.set([x[f_use] for x in s])]
                elif len(s):
                    # otherwise (we are probably in a many2one field),
                    # take the first element of the search
                    f_val = s[0][f_use]
            elif f_ref := field.get("ref"):
                if f_name in model._fields and model._fields[f_name].type == 'reference':
                    val = self.model_id_get(f_ref)
                    f_val = val[0] + ',' + str(val[1])
                else:
                    f_val = self.id_get(f_ref, raise_if_not_found=nodeattr2bool(rec, 'forcecreate', True))
                    if not f_val:
                        _logger.warning("Skipping creation of %r because %s=%r could not be resolved", xid, f_name, f_ref)
                        return None
            else:
                f_val = _eval_xml(self, field, env)
                if f_name in model._fields:
                    field_type = model._fields[f_name].type
                    if field_type == 'many2one':
                        f_val = int(f_val) if f_val else False
                    elif field_type == 'integer':
                        f_val = int(f_val)
                    elif field_type in ('float', 'monetary'):
                        f_val = float(f_val)
                    elif field_type == 'boolean' and isinstance(f_val, str):
                        f_val = str2bool(f_val)
                    elif field_type == 'one2many':
                        for child in field.iterchildren('record'):
                            sub_records.append((child, model._fields[f_name].inverse_name))
                        if isinstance(f_val, str):
                            # We do not want to write on the field since we will write
                            # on the childrens' parents later
                            continue
                    elif field_type == 'html':
                        if field.get('type') == 'xml':
                            _logger.warning('HTML field %r is declared as `type="xml"`', f_name)
            res[f_name] = f_val
        if extra_vals:
            res.update(extra_vals)
        if 'sequence' not in res and 'sequence' in model._fields:
            sequence = self.next_sequence()
            if sequence:
                res['sequence'] = sequence

        data = dict(xml_id=xid, values=res, noupdate=self.noupdate)
        if foreign_record_to_create:
            model = model.with_context(foreign_record_to_create=foreign_record_to_create)
        record = model._load_records([data], self.mode == 'update')
        if xid:
            self.idref[xid] = record.id
        if config.get('import_partial'):
            env.cr.commit()
        for child_rec, inverse_name in sub_records:
            self._tag_record(child_rec, extra_vals={inverse_name: record.id})
        return rec_model, record.id

    def _tag_template(self, el):
        # This helper transforms a <template> element into a <record> and forwards it
        tpl_id = el.get('id', el.get('t-name'))
        full_tpl_id = tpl_id
        if '.' not in full_tpl_id:
            full_tpl_id = '%s.%s' % (self.module, tpl_id)
        # set the full template name for qweb <module>.<id>
        if not el.get('inherit_id'):
            el.set('t-name', full_tpl_id)
            el.tag = 't'
        else:
            el.tag = 'data'
        el.attrib.pop('id', None)

        if self.module.startswith('theme_'):
            model = 'theme.ir.ui.view'
        else:
            model = 'ir.ui.view'

        record_attrs = {
            'id': tpl_id,
            'model': model,
        }
        for att in ['forcecreate', 'context']:
            if att in el.attrib:
                record_attrs[att] = el.attrib.pop(att)

        Field = builder.E.field
        name = el.get('name', tpl_id)

        record = etree.Element('record', attrib=record_attrs)
        record.append(Field(name, name='name'))
        record.append(Field(full_tpl_id, name='key'))
        record.append(Field("qweb", name='type'))
        if 'track' in el.attrib:
            record.append(Field(el.get('track'), name='track'))
        if 'priority' in el.attrib:
            record.append(Field(el.get('priority'), name='priority'))
        if 'inherit_id' in el.attrib:
            record.append(Field(name='inherit_id', ref=el.get('inherit_id')))
        if 'website_id' in el.attrib:
            record.append(Field(name='website_id', ref=el.get('website_id')))
        if 'key' in el.attrib:
            record.append(Field(el.get('key'), name='key'))

        # If the "active" value is set on the root node (instead of an inner
        # <field>), it is treated as the value for the "active" field but only
        # when *not updating*. This allows to update the record in a more recent
        # version without changing its active state (compatibility).
        if el.get('active') in ("True", "False"):
            view_id = self.id_get(tpl_id, raise_if_not_found=False)
            if self.mode != "update" or not view_id:
                record.append(Field(name='active', eval=el.get('active')))

        if el.get('customize_show') in ("True", "False"):
            record.append(Field(name='customize_show', eval=el.get('customize_show')))
        groups = el.attrib.pop('groups', None)
        if groups:
            grp_lst = [("ref('%s')" % x) for x in groups.split(',')]
            record.append(Field(name="group_ids", eval="[Command.set(["+', '.join(grp_lst)+"])]"))
        if el.get('primary') == 'True':
            # Pseudo clone mode, we'll set the t-name to the full canonical xmlid
            el.append(
                builder.E.xpath(
                    builder.E.attribute(full_tpl_id, name='t-name'),
                    expr=".",
                    position="attributes",
                )
            )
            record.append(Field('primary', name='mode'))
        # inject complete <template> element (after changing node name) into
        # the ``arch`` field
        record.append(Field(el, name="arch", type="xml"))

        return self._tag_record(record)

    def _tag_asset(self, el):
        """
        Transforms an <asset> element into a <record> and forwards it.
        """
        asset_id = el.get('id')
        Field = builder.E.field

        record = etree.Element('record', attrib={
            'id': asset_id,
            'model': 'theme.ir.asset' if self.module.startswith('theme_') else 'ir.asset',
        })

        name = el.get('name', asset_id)
        record.append(Field(name, name='name'))

        # E.g. <bundle directive="prepend">web.assets_frontend</bundle>
        # (directive is optional)
        bundle_el = el.find('bundle')
        record.append(Field(bundle_el.text, name='bundle'))
        if 'directive' in bundle_el.attrib:
            record.append(Field(bundle_el.get('directive'), name='directive'))

        # E.g. <path>website/static/src/snippets/s_share/000.scss</path>
        record.append(Field(el.find('path').text, name='path'))

        # Same as <template> for ir.ui.view:
        # If the "active" value is set on the root node (instead of an inner
        # <field>), it is treated as the value for the "active" field but only
        # when *not updating*. This allows to update the record in a more recent
        # version without changing its active state (compatibility).
        if el.get('active') in ("True", "False"):
            record_id = self.id_get(asset_id, raise_if_not_found=False)
            if self.mode != "update" or not record_id:
                record.append(Field(name='active', eval=el.get('active')))

        for child in el.iterchildren('field'):
            record.append(child)

        return self._tag_record(record)

    def id_get(self, id_str, raise_if_not_found=True):
        id_str = self.make_xml_id(id_str)
        if id_str in self.idref:
            return self.idref[id_str]
        return self.model_id_get(id_str, raise_if_not_found)[1]

    def model_id_get(self, id_str, raise_if_not_found=True):
        id_str = self.make_xml_id(id_str)
        return self.env['ir.model.data']._xmlid_to_res_model_res_id(id_str, raise_if_not_found=raise_if_not_found)

    def _tag_root(self, el):
        for rec in el:
            f = self._tags.get(rec.tag)
            if f is None:
                continue

            self.envs.append(self.get_env(el))
            self._noupdate.append(nodeattr2bool(el, 'noupdate', self.noupdate))
            self._sequences.append(0 if nodeattr2bool(el, 'auto_sequence', False) else None)
            try:
                f(rec)
            except ParseError:
                raise
            except ValidationError as err:
                msg = "while parsing {file}:{viewline}\n{err}\n\nView error context:\n{context}\n".format(
                    file=rec.getroottree().docinfo.URL,
                    viewline=rec.sourceline,
                    context=pprint.pformat(getattr(err, 'context', None) or '-no context-'),
                    err=err.args[0],
                )
                _logger.debug(msg, exc_info=True)
                raise ParseError(msg) from None  # Restart with "--log-handler orbex.tools.convert:DEBUG" for complete traceback
            except Exception as e:
                raise ParseError('while parsing %s:%s, somewhere inside\n%s' % (
                    rec.getroottree().docinfo.URL,
                    rec.sourceline,
                    etree.tostring(rec, encoding='unicode').rstrip()
                )) from e
            finally:
                self._noupdate.pop()
                self.envs.pop()
                self._sequences.pop()

    @property
    def env(self):
        return self.envs[-1]

    @property
    def noupdate(self):
        return self._noupdate[-1]

    def next_sequence(self):
        value = self._sequences[-1]
        if value is not None:
            value = self._sequences[-1] = value + 10
        return value

    def __init__(self, env, module, idref: Optional[IdRef], mode: ConvertMode, noupdate: bool = False, xml_filename: str = ''):
        self.mode = mode
        self.module = module
        self.envs = [env(context=dict(env.context, lang=None))]
        self.idref: IdRef = {} if idref is None else idref
        self._noupdate = [noupdate]
        self._sequences = []
        self.xml_filename = xml_filename
        self._tags = {
            'record': self._tag_record,
            'delete': self._tag_delete,
            'function': self._tag_function,
            'menuitem': self._tag_menuitem,
            'template': self._tag_template,
            'asset': self._tag_asset,

            **dict.fromkeys(self.DATA_ROOTS, self._tag_root)
        }

    def parse(self, de):
        assert de.tag in self.DATA_ROOTS, "Root xml tag must be <openerp>, <orbex> or <data>."
        self._tag_root(de)
    DATA_ROOTS = ['orbex', 'data', 'openerp']


class json_import:
    DATA_KEYS = ('records', 'menus', 'actions', 'templates', 'assets', 'delete', 'functions')

    def __init__(
            self,
            env,
            module,
            idref: Optional[IdRef],
            mode: ConvertMode,
            noupdate: bool = False,
            filename: str = '',
    ):
        self.mode = mode
        self.module = module
        self.env = env(context=dict(env.context, lang=None))
        self.idref: IdRef = {} if idref is None else idref
        self.noupdate = noupdate
        self.filename = filename
        self._pending_menu_actions = []

    def make_xml_id(self, record_id):
        if not record_id or '.' in record_id:
            return record_id
        return "%s.%s" % (self.module, record_id)

    def id_get(self, id_str, raise_if_not_found=True):
        xid = self.make_xml_id(id_str)
        if xid in self.idref:
            return self.idref[xid]
        return self.model_id_get(xid, raise_if_not_found)[1]

    def model_id_get(self, id_str, raise_if_not_found=True):
        xid = self.make_xml_id(id_str)
        return self.env['ir.model.data']._xmlid_to_res_model_res_id(xid, raise_if_not_found=raise_if_not_found)

    def _eval_context(self, model_name=None):
        return _get_eval_context(self, self.env, model_name)

    def _resolve_search(self, spec, field):
        model_name = spec.get('model') or field.comodel_name
        if not model_name:
            raise ParseError(f"JSON search value in {self.filename} requires a model")
        domain = spec.get('domain', spec.get('search', []))
        if isinstance(domain, str):
            domain = safe_eval(domain, self._eval_context(model_name))
        use = spec.get('use', 'id')
        records = self.env[model_name].search(domain)
        if field.type == 'many2many':
            from orbex.fields import Command  # noqa: PLC0415
            return [Command.set([record[use] for record in records])]
        return records and records[0][use] or False

    def _resolve_command(self, spec):
        from orbex.fields import Command  # noqa: PLC0415
        command = spec.get('command')
        refs = [self.id_get(ref) for ref in spec.get('refs', [])]
        ids = spec.get('ids', [])
        values = refs + ids
        match command:
            case 'set':
                return Command.set(values)
            case 'link':
                return [Command.link(value) for value in values]
            case 'unlink':
                return [Command.unlink(value) for value in values]
            case 'clear':
                return Command.clear()
            case _:
                raise ParseError(f"Unsupported JSON command {command!r} in {self.filename}")

    def _read_module_file(self, path, binary=False):
        path_parts = path.split('/', 1)
        if len(path_parts) == 2 and path_parts[0] == f'{self.module}_json':
            path = f'{self.module}/{path_parts[1]}'
        if os.path.isabs(path) or path.split('/', 1)[0] == self.module:
            full_path = path
        else:
            full_path = os.path.join(self.module, path)
        mode = 'rb' if binary else 'r'
        with file_open(full_path, mode, env=self.env) as file:
            return file.read()

    def _process_string_refs(self, value):
        def replace(match):
            record_id = match.group(1)
            xid = self.make_xml_id(record_id)
            if (database_id := self.idref.get(xid)) is None:
                database_id = self.idref[xid] = self.id_get(xid)
            return str(database_id)
        return re.sub(r'(?<!%)%\((.*?)\)[ds]', replace, value).replace('%%', '%')

    def _resolve_value(self, value, model, field_name):
        field = model._fields.get(field_name)
        if field and field.type == 'json':
            return value
        if isinstance(value, list):
            return [self._resolve_value(item, model, field_name) for item in value]
        if isinstance(value, str):
            return self._process_string_refs(value)
        if not isinstance(value, dict):
            return value

        if 'ref' in value:
            if field and field.type == 'reference':
                ref_model, ref_id = self.model_id_get(value['ref'])
                return f'{ref_model},{ref_id}'
            return self.id_get(value['ref'], raise_if_not_found=value.get('required', True))
        if 'eval' in value:
            eval_model = value.get('model') or (field and field.comodel_name)
            return safe_eval(value['eval'], self._eval_context(eval_model))
        if 'search' in value or 'domain' in value:
            if not field:
                raise ParseError(f"JSON search value for unknown field {field_name!r} in {self.filename}")
            return self._resolve_search(value, field)
        if 'command' in value:
            return self._resolve_command(value)
        if 'file' in value:
            if value.get('type') == 'file':
                path = value['file']
                if path.split('/', 1)[0] == self.module:
                    path = path.split('/', 1)[1]
                return '%s,%s' % (self.module, path)
            data = self._read_module_file(value['file'], binary=value.get('type') == 'base64')
            if value.get('type') == 'base64':
                return base64.b64encode(data)
            return data
        if 'html' in value:
            return self._read_module_file(value['html'])

        return {
            key: self._resolve_value(item, model, key)
            for key, item in value.items()
        }

    def _record_values(self, model, values):
        resolved = {}
        for field_name, value in values.items():
            if '@' in field_name:
                continue
            resolved[field_name] = self._resolve_value(value, model, field_name)
        return resolved

    def _load_record(self, item, default_model=None):
        model_name = item.get('model') or default_model
        if not model_name:
            raise ParseError(f"JSON record in {self.filename} requires a model")
        record_id = item.get('id', '')
        xid = self.make_xml_id(record_id)
        model = self.env[model_name]
        if self.filename and record_id:
            model = model.with_context(
                install_mode=True,
                install_module=self.module,
                install_filename=self.filename,
                install_xmlid=record_id,
            )
        if self.noupdate and self.mode != 'init' and record_id:
            if record := self.env['ir.model.data']._load_xmlid(xid):
                self.idref[xid] = record.id
                return record
            if item.get('forcecreate') is False:
                return None
        values = self._record_values(model, item.get('values', item.get('fields', {})))
        data = {
            'xml_id': xid,
            'values': values,
            'noupdate': item.get('noupdate', self.noupdate),
        }
        record = model._load_records([data], self.mode == 'update')
        if xid:
            self.idref[xid] = record.id
        if config.get('import_partial'):
            self.env.cr.commit()
        return record

    def _load_menu(self, item):
        values = {
            'name': item.get('name') or item.get('id') or '?',
            'active': item.get('active', True),
            'parent_id': False,
        }
        if item.get('parent'):
            values['parent_id'] = self.id_get(item['parent'])
        if item.get('sequence') is not None:
            values['sequence'] = item['sequence']
        if item.get('web_icon'):
            values['web_icon'] = item['web_icon']
        if item.get('action'):
            action_ref = item['action']
            action = self.env.ref(self.make_xml_id(action_ref), raise_if_not_found=False)
            if action:
                action = action.sudo()
                values['action'] = "%s,%d" % (action.type, action.id)
        if item.get('groups'):
            from orbex.fields import Command  # noqa: PLC0415
            values['group_ids'] = [Command.link(self.id_get(group)) for group in item['groups']]
        record = self._load_record({
            'id': item['id'],
            'model': 'ir.ui.menu',
            'values': values,
            'noupdate': item.get('noupdate', self.noupdate),
        })
        for child in item.get('children', []):
            child.setdefault('parent', item['id'])
            self._load_menu(child)
        if item.get('action') and 'action' not in values:
            self._pending_menu_actions.append((record, item['action']))
        return record

    def _flush_pending_menu_actions(self):
        for menu, action_ref in self._pending_menu_actions:
            action = self.env.ref(self.make_xml_id(action_ref)).sudo()
            menu.write({'action': "%s,%d" % (action.type, action.id)})
        self._pending_menu_actions.clear()

    def _load_template(self, item):
        template_id = item.get('id') or item.get('t_name')
        if not template_id:
            raise ParseError(f"JSON template in {self.filename} requires an id or t_name")
        full_template_id = self.make_xml_id(template_id)
        source_path = item.get('template') or item.get('html')
        arch = item.get('arch') or self._read_module_file(source_path)
        if item.get('type') == 'html' or item.get('template'):
            root = etree.fromstring(arch.encode(), parser=etree.XMLParser(recover=True))
            root.set('data-template', item.get('id') or template_id)
            for node in root.xpath('//*[@data-value]'):
                value_name = node.attrib.pop('data-value')
                node.set('t-att-value', "request.csrf_token()" if value_name == 'csrf_token' else value_name)
            for node in root.xpath('//*[@data-visible-if]'):
                node.set('t-if', node.attrib.pop('data-visible-if'))
            for node in root.xpath('//*[@data-text]'):
                node.append(builder.E.t(**{'t-esc': node.attrib.pop('data-text')}))

            body = etree.tostring(root, encoding='unicode')
            if layout := item.get('layout'):
                context = item.get('context') or {}
                context_nodes = [
                    builder.E.t(str(int(value)) if isinstance(value, bool) else str(value), **{'t-set': key})
                    for key, value in context.items()
                ]
                wrapper = builder.E.template(
                    builder.E.t(
                        *context_nodes,
                        etree.fromstring(body.encode(), parser=etree.XMLParser(recover=True)),
                        **{'t-call': layout},
                    ),
                    name=item.get('name') or template_id,
                )
                arch = etree.tostring(wrapper, encoding='unicode')
            else:
                wrapper = builder.E.template(
                    etree.fromstring(body.encode(), parser=etree.XMLParser(recover=True)),
                    name=item.get('name') or template_id,
                )
                arch = etree.tostring(wrapper, encoding='unicode')
        try:
            root = etree.fromstring(arch.encode())
        except etree.XMLSyntaxError:
            root = None
        if root is not None and root.tag == 'template':
            inherit_id = item.get('inherit_id') or root.get('inherit_id')
            root.attrib.pop('id', None)
            if inherit_id:
                root.tag = 'data'
            else:
                root.set('t-name', full_template_id)
                root.tag = 't'
            if item.get('primary') is True or root.get('primary') == 'True':
                root.append(
                    builder.E.xpath(
                        builder.E.attribute(full_template_id, name='t-name'),
                        expr=".",
                        position="attributes",
                    )
                )
                item = {**item, 'mode': 'primary'}
            arch = etree.tostring(root, encoding='unicode')
        values = {
            'name': item.get('name') or template_id,
            'key': item.get('key') or full_template_id,
            'type': 'qweb',
            'arch': arch,
        }
        for field_name in ('priority', 'track', 'mode', 'active', 'customize_show'):
            if field_name in item:
                values[field_name] = item[field_name]
        if item.get('inherit_id'):
            values['inherit_id'] = {'ref': item['inherit_id']}
        if item.get('website_id'):
            values['website_id'] = {'ref': item['website_id']}
        return self._load_record({
            'id': template_id,
            'model': item.get('model') or ('theme.ir.ui.view' if self.module.startswith('theme_') else 'ir.ui.view'),
            'values': values,
            'noupdate': item.get('noupdate', self.noupdate),
        })

    def _load_delete(self, item):
        model_name = item.get('model')
        records = self.env[model_name]
        if item.get('search'):
            domain = item['search']
            if isinstance(domain, str):
                domain = safe_eval(domain, self._eval_context(model_name))
            records = records.search(domain)
        if item.get('id'):
            records += records.browse(self.id_get(item['id']))
        if records:
            records.unlink()

    def _load_function(self, item):
        if self.noupdate and self.mode != 'init':
            return
        model = self.env[item['model']]
        method = getattr(model, item['name'])
        args = [self._resolve_value(arg, model, '') for arg in item.get('args', [])]
        kwargs = {
            key: self._resolve_value(value, model, key)
            for key, value in item.get('kwargs', {}).items()
        }
        method(*args, **kwargs)

    def parse(self, payload):
        if isinstance(payload, list):
            payload = {'records': payload}
        if not isinstance(payload, dict):
            raise ParseError(f"JSON root in {self.filename} must be an object or list")

        local_noupdate = payload.get('noupdate')
        previous_noupdate = self.noupdate
        if local_noupdate is not None:
            self.noupdate = bool(local_noupdate)
        try:
            for item in _ensure_list(payload.get('menus'), 'menus'):
                self._load_menu(item)
            for item in _ensure_list(payload.get('records'), 'records'):
                self._load_record(item)
            for item in _ensure_list(payload.get('actions'), 'actions'):
                self._load_record(item)
            self._flush_pending_menu_actions()
            for item in _ensure_list(payload.get('templates'), 'templates'):
                self._load_template(item)
            for item in _ensure_list(payload.get('assets'), 'assets'):
                self._load_record(item, default_model='ir.asset')
            for item in _ensure_list(payload.get('delete'), 'delete'):
                self._load_delete(item)
            for item in _ensure_list(payload.get('functions'), 'functions'):
                self._load_function(item)
        except Exception as err:
            raise ParseError(f"while parsing {self.filename}\n{err}") from err
        finally:
            self.noupdate = previous_noupdate


def convert_file(
        env,
        module,
        filename,
        idref: Optional[IdRef],
        mode: ConvertMode = 'update',
        noupdate=False,
        kind=None,
        pathname=None,
):
    if kind is not None:
        warnings.warn(
            "The `kind` argument is deprecated in orbex 19.",
            DeprecationWarning,
            stacklevel=2,
        )
    if pathname is None:
        pathname = os.path.join(module, filename)
    ext = os.path.splitext(filename)[1].lower()

    with file_open(pathname, 'rb', env=env) as fp:
        if ext == '.csv':
            convert_csv_import(env, module, pathname, fp.read(), idref, mode, noupdate)
        elif ext == '.sql':
            convert_sql_import(env, fp)
        elif ext == '.json':
            convert_json_import(env, module, fp, idref, mode, noupdate)
        elif ext == '.html':
            convert_html_import(env, module, fp, idref, mode, noupdate)
        elif ext == '.xml':
            raise ValueError(
                "XML imports are not supported in Orbex. Convert %s to JSON/HTML before loading it."
                % filename
            )
        elif ext == '.js':
            pass # .js files are valid but ignored here.
        else:
            raise ValueError("Can't load unknown file type %s.", filename)


def convert_sql_import(env, fp):
    env.cr.execute(fp.read()) # pylint: disable=sql-injection


def convert_csv_import(
        env,
        module,
        fname,
        csvcontent,
        idref: Optional[IdRef] = None,
        mode: ConvertMode = 'init',
        noupdate=False,
):
    '''Import csv file :
        quote: "
        delimiter: ,
        encoding: utf-8'''
    env = env(context=dict(env.context, lang=None))
    filename, _ext = os.path.splitext(os.path.basename(fname))
    model = filename.split('-')[0]
    reader = csv.reader(io.StringIO(csvcontent.decode()), quotechar='"', delimiter=',')
    fields = next(reader)

    if not (mode == 'init' or 'id' in fields):
        _logger.error("Import specification does not contain 'id' and we are in init mode, Cannot continue.")
        return

    translate_indexes = {i for i, field in enumerate(fields) if '@' in field}
    def remove_translations(row):
        return [cell for i, cell in enumerate(row) if i not in translate_indexes]

    fields = remove_translations(fields)
    if not fields:
        return

    # clean the data from translations (treated during translation import), then
    # filter out empty lines (any([]) == False) and lines containing only empty cells
    datas = [
        data_line for line in reader
        if any(data_line := remove_translations(line))
    ]

    context = {
        'mode': mode,
        'module': module,
        'install_mode': True,
        'install_module': module,
        'install_filename': fname,
        'noupdate': noupdate,
    }
    result = env[model].with_context(**context).load(fields, datas)
    if any(msg['type'] == 'error' for msg in result['messages']):
        # Report failed import and abort module install
        warning_msg = "\n".join(msg['message'] for msg in result['messages'])
        raise Exception(env._(
            "Module loading %(module)s failed: file %(file)s could not be processed:\n%(message)s",
            module=module,
            file=fname,
            message=warning_msg,
        ))


def convert_json_import(
        env,
        module,
        jsonfile,
        idref: Optional[IdRef] = None,
        mode: ConvertMode = 'init',
        noupdate=False,
):
    try:
        payload = json.load(io.TextIOWrapper(jsonfile, encoding='utf-8'))
    except json.JSONDecodeError as err:
        raise ParseError(f"while parsing {getattr(jsonfile, 'name', '<json>')}\n{err}") from err
    importer = json_import(
        env,
        module,
        idref,
        mode,
        noupdate=noupdate,
        filename=getattr(jsonfile, 'name', ''),
    )
    importer.parse(payload)


def convert_html_import(
        env,
        module,
        htmlfile,
        idref: Optional[IdRef] = None,
        mode: ConvertMode = 'init',
        noupdate=False,
):
    filename = getattr(htmlfile, 'name', '')
    arch = htmlfile.read().decode('utf-8')
    template_names = re.findall(r"""\bt-name\s*=\s*["']([^"']+)["']""", arch)
    template_id = template_names[0] if template_names else os.path.splitext(os.path.basename(filename))[0]
    if template_id.startswith(f'{module}.'):
        template_id = template_id.split('.', 1)[1]
    importer = json_import(env, module, idref, mode, noupdate=noupdate, filename=filename)
    importer.parse({
        'templates': [{
            'id': template_id,
            'name': template_id,
            'arch': arch,
        }]
    })


def convert_xml_import(
        env,
        module,
        xmlfile,
        idref: Optional[IdRef] = None,
        mode: ConvertMode = 'init',
        noupdate=False,
        report=None,
):
    doc = etree.parse(xmlfile)
    schema = os.path.join(config.root_path, 'import_xml.rng')
    relaxng = etree.RelaxNG(etree.parse(schema))
    try:
        relaxng.assert_(doc)
    except Exception:
        _logger.exception("The XML file '%s' does not fit the required schema!", xmlfile.name)
        if jingtrang:
            p = subprocess.run(['pyjing', schema, xmlfile.name], stdout=subprocess.PIPE)
            _logger.warning(p.stdout.decode())
        else:
            for e in relaxng.error_log:
                _logger.warning(e)
            _logger.info("Install 'jingtrang' for more precise and useful validation messages.")
        raise

    if isinstance(xmlfile, str):
        xml_filename = xmlfile
    else:
        xml_filename = xmlfile.name
    obj = xml_import(env, module, idref, mode, noupdate=noupdate, xml_filename=xml_filename)
    obj.parse(doc.getroot())
