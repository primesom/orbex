# Part of Orbex. See LICENSE file for full copyright and licensing details.

from orbex import fields, models


class IrActionsAct_WindowView(models.Model):
    _inherit = 'ir.actions.act_window.view'

    view_mode = fields.Selection(selection_add=[('hierarchy', 'Hierarchy')], ondelete={'hierarchy': 'cascade'})
