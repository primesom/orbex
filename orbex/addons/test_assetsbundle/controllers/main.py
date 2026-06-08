# -*- coding: utf-8 -*-
# Part of Orbex. See LICENSE file for full copyright and licensing details.

from orbex.api import SUPERUSER_ID
from orbex.http import Controller, request, route

class TestAssetsBundleController(Controller):
    @route('/test_assetsbundle/js', type='http', auth='user')
    def bundle(self):
        env = request.env(user=SUPERUSER_ID)
        return env['ir.ui.view']._render_template('test_assetsbundle.template1')
