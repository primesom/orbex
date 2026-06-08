# -*- coding: utf-8 -*-
# Part of Orbex. See LICENSE file for full copyright and licensing details.

from orbex import fields, models


class WebsiteEventMenu(models.Model):
    _inherit = "website.event.menu"

    menu_type = fields.Selection(
        selection_add=[('track', 'Event Tracks Menus'), ('track_proposal', 'Event Proposals Menus')],
        ondelete={'track': 'cascade', 'track_proposal': 'cascade'})
