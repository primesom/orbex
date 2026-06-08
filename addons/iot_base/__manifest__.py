# -*- coding: utf-8 -*-
# Part of Orbex. See LICENSE file for full copyright and licensing details.


{
    'name': 'IoT Base',
    'version': '1.0',
    'category': 'Hidden',
    'description': """
Base tools required by all IoT related modules.
===============================================
""",
    'depends': ['web'],
    'installable': True,
    'license': 'OSPL-1',
    'assets': {
        'web.assets_backend': [
            'iot_base/static/src/network_utils/*',
            'iot_base/static/src/device_controller.js',
        ],
    },
}
