
# Part of Orbex. See LICENSE file for full copyright and licensing details.

import orbex as orbex

import orbex.tests
from orbex.tests.common import HttpCase


@orbex.tests.tagged('-at_install', 'post_install')
class TestHtmlBuilderAssetsBundle(HttpCase):

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.bundle = cls.env["ir.qweb"]._get_asset_bundle("html_builder.assets", True)

    def test_html_builder_assets_bundle_no_edit_scss(self):
        for file in self.bundle.files:
            filename = file["filename"]
            self.assertFalse(filename.endswith("edit.scss"), msg="html_builder.assets must not contain *.edit.scss files. Remove " + filename)
