# -*- coding: utf-8 -*-
# Part of Orbex. See LICENSE file for full copyright and licensing details.

from orbex import fields, models


class ResConfigSettings(models.TransientModel):
    _inherit = 'res.config.settings'

    l10n_ke_cu_proxy_address = fields.Char(related='company_id.l10n_ke_cu_proxy_address', readonly=False)
