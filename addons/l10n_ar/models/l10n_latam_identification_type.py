# Part of Orbex. See LICENSE file for full copyright and licensing details.
from orbex import models, fields


class L10n_LatamIdentificationType(models.Model):
    _inherit = "l10n_latam.identification.type"

    l10n_ar_afip_code = fields.Char("ARCA Code")
