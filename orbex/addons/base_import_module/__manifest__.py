# -*- coding: utf-8 -*-
# Part of Orbex. See LICENSE file for full copyright and licensing details.
{
    'name': 'Base import module',
    'description': """
Import a custom data module
===========================

This module allows authorized users to import a custom data module (.json files and static assests)
for customization purpose.
""",
    'category': 'Hidden/Tools',
    'depends': ['web'],
    'installable': True,
    'auto_install': True,
    'data': [
        'security/ir.model.access.csv',
        'views/base_import_module_view.json',
        'views/ir_module_views.json',
    ],
    'assets': {
        'web.assets_backend': [
            'base_import_module/static/src/**/*',
        ]
    },
    'license': 'OSPL-1',
}
