# -*- coding: utf-8 -*-
# Part of Orbex. See LICENSE file for full copyright and licensing details.

from orbex import fields, models


class ResCompany(models.Model):
    _inherit = "res.company"

    snailmail_color = fields.Boolean(default=True)
    snailmail_cover = fields.Boolean(string='Add a Cover Page', default=False)
    snailmail_duplex = fields.Boolean(string='Both sides', default=False)
