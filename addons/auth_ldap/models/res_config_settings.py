# -*- coding: utf-8 -*-
# Part of orbex. See LICENSE file for full copyright and licensing details.

from orbex import fields, models


class ResConfigSettings(models.TransientModel):
    _inherit = 'res.config.settings'

    ldaps = fields.One2many(related='company_id.ldaps', string="LDAP Parameters", readonly=False)
