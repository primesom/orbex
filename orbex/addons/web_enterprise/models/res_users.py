# Part of orbex. See LICENSE file for full copyright and licensing details.

from orbex import fields, models


class ResUsers(models.Model):
    _inherit = "res.users"

    color_scheme = fields.Selection(related="res_users_settings_id.color_scheme", readonly=False)
    chatter_position = fields.Selection(related="res_users_settings_id.chatter_position", readonly=False)

    @property
    def SELF_READABLE_FIELDS(self):
        return super().SELF_READABLE_FIELDS + ["color_scheme", "chatter_position"]

    @property
    def SELF_WRITEABLE_FIELDS(self):
        return super().SELF_WRITEABLE_FIELDS + ["color_scheme", "chatter_position"]
