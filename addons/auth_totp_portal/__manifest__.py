{
    'name': "TOTorbex",
    'category': 'Hidden',
    'depends': ['orbex', 'auth_totp'],
    'auto_install': True,
    'data': [
        'security/security.xml',
        'views/templates.xml',
    ],
    'assets': {
        'web.assets_frontend': [
            'auth_totp_orbex/static/src/**/*',
        ],
        'web.assets_tests': [
            'auth_totp_orbex/static/tests/**/*',
        ],
    },
    'author': 'orbex S.A.',
    'license': 'LGPL-3',
}
