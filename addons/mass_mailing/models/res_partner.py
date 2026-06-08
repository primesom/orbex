# -*- coding: utf-8 -*-
# Part of Orbex. See LICENSE file for full copyright and licensing details.

from orbex import models


class ResPartner(models.Model):
    _inherit = 'res.partner'
    _mailing_enabled = True
