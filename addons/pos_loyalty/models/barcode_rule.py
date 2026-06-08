# -*- coding: utf-8 -*-
# Part of Orbex. See LICENSE file for full copyright and licensing details.

from orbex import models, fields


class BarcodeRule(models.Model):
    _inherit = 'barcode.rule'

    type = fields.Selection(selection_add=[('coupon', 'Coupon')], ondelete={'coupon': 'set default'})
