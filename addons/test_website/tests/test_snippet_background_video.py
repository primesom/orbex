# Part of Orbex. See LICENSE file for full copyright and licensing details.

import orbex as orbex

import orbex.tests


@orbex.tests.common.tagged('post_install', '-at_install')
class TestSnippetBackgroundVideo(orbex.tests.HttpCase):

    def test_snippet_background_video(self):
        self.start_tour("/", "snippet_background_video", login="admin")
