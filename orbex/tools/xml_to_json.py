# Part of orbex. See LICENSE file for full copyright and licensing details.

from __future__ import annotations

import argparse
import json
from pathlib import Path

from lxml import etree


def _bool(value):
    if value is None:
        return None
    return value.lower() not in ('0', 'false', 'off')


def _text(node):
    return node.text or ''


def _children_markup(node, method='xml'):
    children = [child for child in node if isinstance(child.tag, str)]
    content = ''.join(etree.tostring(child, encoding='unicode', method=method) for child in node)
    if method == 'xml' and len(children) > 1:
        return f'<data>{content}</data>'
    return content


def _field_value(field):
    if field.get('ref'):
        return {'ref': field.get('ref')}
    if field.get('eval'):
        value = {'eval': field.get('eval')}
        if field.get('model'):
            value['model'] = field.get('model')
        return value
    if field.get('search'):
        value = {
            'search': field.get('search'),
            'use': field.get('use', 'id'),
        }
        if field.get('model'):
            value['model'] = field.get('model')
        return value
    if field.get('file'):
        value = {
            'file': field.get('file'),
            'type': field.get('type', 'text'),
        }
        return value

    field_type = field.get('type', 'char')
    if field_type == 'xml':
        return _children_markup(field)
    if field_type == 'html':
        return _children_markup(field, method='html')
    if field_type == 'int':
        value = _text(field).strip()
        return None if value == 'None' else int(value)
    if field_type == 'float':
        return float(_text(field).strip())
    if field_type == 'list':
        return [_field_value(child) for child in field.iterchildren('value')]
    if field_type == 'tuple':
        return [_field_value(child) for child in field.iterchildren('value')]
    return _text(field)


def _record(node):
    values = {}
    for field in node.iterchildren('field'):
        name = field.get('name')
        if name:
            values[name] = _field_value(field)
    item = {
        'id': node.get('id', ''),
        'model': node.get('model'),
        'values': values,
    }
    if node.get('forcecreate') is not None:
        item['forcecreate'] = _bool(node.get('forcecreate'))
    if node.get('context'):
        item['context'] = node.get('context')
    return item


def _menu(node):
    item = {
        'id': node.get('id'),
        'name': node.get('name'),
    }
    for key in ('parent', 'action', 'web_icon'):
        if node.get(key):
            item[key] = node.get(key)
    if node.get('sequence'):
        item['sequence'] = int(node.get('sequence'))
    if node.get('active') is not None:
        item['active'] = _bool(node.get('active'))
    if node.get('groups'):
        item['groups'] = [group for group in node.get('groups').split(',') if group and not group.startswith('-')]
    children = [_menu(child) for child in node.iterchildren('menuitem')]
    if children:
        item['children'] = children
    return item


def _template(node):
    template_id = node.get('id') or node.get('t-name')
    arch_node = etree.fromstring(etree.tostring(node))
    arch_node.attrib.pop('id', None)
    item = {
        'id': template_id,
        'name': node.get('name') or template_id,
        'arch': etree.tostring(arch_node, encoding='unicode'),
    }
    for key in ('priority', 'track', 'primary', 'active', 'customize_show'):
        if node.get(key) is not None:
            item[key] = _bool(node.get(key)) if node.get(key) in ('True', 'False') else node.get(key)
    if node.get('inherit_id'):
        item['inherit_id'] = node.get('inherit_id')
    if node.get('website_id'):
        item['website_id'] = node.get('website_id')
    if node.get('key'):
        item['key'] = node.get('key')
    return item


def _asset(node):
    values = {
        'name': node.get('name') or node.get('id'),
    }
    bundle = node.find('bundle')
    path = node.find('path')
    if bundle is not None:
        values['bundle'] = _text(bundle)
        if bundle.get('directive'):
            values['directive'] = bundle.get('directive')
    if path is not None:
        values['path'] = _text(path)
    for field in node.iterchildren('field'):
        name = field.get('name')
        if name:
            values[name] = _field_value(field)
    return {
        'id': node.get('id'),
        'model': 'ir.asset',
        'values': values,
    }


def convert_xml_path(path):
    root = etree.parse(str(path)).getroot()
    payload = {
        'records': [],
        'menus': [],
        'templates': [],
        'assets': [],
        'delete': [],
        'functions': [],
    }

    def walk(parent, noupdate=False):
        if parent.get('noupdate') is not None:
            noupdate = _bool(parent.get('noupdate'))
        for node in parent:
            if not isinstance(node.tag, str):
                continue
            if node.tag in ('orbex', 'openerp', 'data'):
                walk(node, noupdate=noupdate)
            elif node.tag == 'record':
                item = _record(node)
                if noupdate:
                    item['noupdate'] = True
                payload['records'].append(item)
            elif node.tag == 'menuitem':
                item = _menu(node)
                if noupdate:
                    item['noupdate'] = True
                payload['menus'].append(item)
            elif node.tag == 'template':
                item = _template(node)
                if noupdate:
                    item['noupdate'] = True
                payload['templates'].append(item)
            elif node.tag == 'asset':
                item = _asset(node)
                if noupdate:
                    item['noupdate'] = True
                payload['assets'].append(item)
            elif node.tag == 'delete':
                payload['delete'].append(dict(node.attrib))
            elif node.tag == 'function':
                payload['functions'].append(dict(node.attrib))

    walk(root)
    return {key: value for key, value in payload.items() if value}


def main(argv=None):
    parser = argparse.ArgumentParser(description='Convert Orbex/Odoo-style XML data to Orbex JSON.')
    parser.add_argument('source', type=Path)
    parser.add_argument('-o', '--output', type=Path)
    args = parser.parse_args(argv)

    payload = convert_xml_path(args.source)
    text = json.dumps(payload, ensure_ascii=False, indent=2)
    if args.output:
        args.output.write_text(text + '\n', encoding='utf-8')
    else:
        print(text)


if __name__ == '__main__':
    main()
