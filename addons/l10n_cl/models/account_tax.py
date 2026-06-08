# -*- coding: utf-8 -*-
# Part of Orbex. See LICENSE file for full copyright and licensing details.
from orbex import fields, models


class AccountTax(models.Model):
    _inherit = 'account.tax'

    l10n_cl_sii_code = fields.Integer('SII Code', aggregator=False)
