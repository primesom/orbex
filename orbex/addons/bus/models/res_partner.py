# Part of Orbex. See LICENSE file for full copyright and licensing details.

from orbex import models


class ResPartner(models.Model):
    _name = "res.partner"
    _inherit = ["res.partner", "bus.listener.mixin"]
