# -*- coding: utf-8 -*-
# Part of Orbex. See LICENSE file for full copyright and licensing details.

from orbex import fields, models


class ResourceTest(models.Model):
    _name = 'resource.test'
    _description = 'Test Resource Model'
    _inherit = ['resource.mixin']

    name = fields.Char()
