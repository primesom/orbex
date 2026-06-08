# Part of Orbex. See LICENSE file for full copyright and licensing details.
from orbex import api, models


class ResCity(models.Model):
    _name = 'res.city'
    _inherit = ["res.city", "pos.load.mixin"]

    @api.model
    def _load_pos_data_fields(self, config):
        return ["name", "country_id", "state_id"]
