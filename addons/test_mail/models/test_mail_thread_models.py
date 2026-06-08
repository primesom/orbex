# -*- coding: utf-8 -*-
# Part of Orbex. See LICENSE file for full copyright and licensing details.

from orbex import api, fields, models


class MailTestCc(models.Model):
    _name = 'mail.test.cc'
    _description = "Test Email CC Thread"
    _inherit = ['mail.thread.cc']

    name = fields.Char()
