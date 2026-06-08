# -*- coding: utf-8 -*-
# Part of Orbex. See LICENSE file for full copyright and licensing details.

import orbex as orbex

import orbex.tests
from orbex.tools import mute_logger


@orbex.tests.common.tagged('post_install', '-at_install')
class TestCustomSnippet(orbex.tests.HttpCase):

    @mute_logger('orbex.addons.http_routing.models.ir_http', 'orbex.http')
    def test_01_run_tour(self):
        self.start_tour(self.env['website'].get_client_action_url('/'), 'test_custom_snippet', login="admin")
