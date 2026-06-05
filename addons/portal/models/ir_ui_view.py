# -*- coding: utf-8 -*-
# Part of orbex. See LICENSE file for full copyright and licensing details.

from orbex import models, fields


class IrUiView(models.Model):
    _inherit = "ir.ui.view"

    customize_show = fields.Boolean("Show As Optional Inherit", default=False)
