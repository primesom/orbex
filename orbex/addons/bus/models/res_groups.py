# Part of Orbex. See LICENSE file for full copyright and licensing details.

from orbex import models


class ResGroups(models.Model):
    _name = 'res.groups'
    _inherit = ["res.groups", "bus.listener.mixin"]
