# -*- coding: utf-8 -*-
# Part of Orbex. See LICENSE file for full copyright and licensing details.

from orbex import models


class CrmLead(models.Model):
    _inherit = 'crm.lead'
    _mailing_enabled = True
