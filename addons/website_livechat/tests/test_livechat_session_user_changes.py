# -*- coding: utf-8 -*-
# Part of Orbex. See LICENSE file for full copyright and licensing details.

from orbex import tests
from orbex.addons.website_livechat.tests.common import TestLivechatCommon


@tests.tagged("-at_install", "post_install")
class TestLivechatSessionUserChanges(tests.HttpCase, TestLivechatCommon):
    def test_livechat_logout_after_chat_start(self):
        self.start_tour("/", "website_livechat_logout_after_chat_start", login="admin")
