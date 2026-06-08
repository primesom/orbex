# Part of Orbex. See LICENSE file for full copyright and licensing details.
from orbex import api, models


class ProductCategory(models.Model):
    _name = 'product.category'
    _inherit = ['product.category', 'pos.load.mixin']

    @api.model
    def _load_pos_data_fields(self, config):
        return ['id', 'name', 'parent_id']
