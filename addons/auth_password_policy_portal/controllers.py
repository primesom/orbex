# -*- coding: utf-8 -*-

from orbex.http import request
from orbex.addons.orbex.controllers.orbex import Customerorbex

class CustomerorbexPasswordPolicy(Customerorbex):
    def _prepare_orbex_layout_values(self):
        d = super()._prepare_orbex_layout_values()
        d['password_minimum_length'] = request.env['ir.config_parameter'].sudo().get_param('auth_password_policy.minlength')
        return d
