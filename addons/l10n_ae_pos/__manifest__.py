{
    'name': 'United Arab Emirates - Point of Sale',
    'category': 'Accounting/Localizations/Point of Sale',
    'description': """
United Arab Emirates POS Localization
===========================================================
    """,
    'license': 'OSPL-1',
    'depends': [
        'l10n_gcc_pos',
        'l10n_ae',
    ],
    'assets': {
        'point_of_sale._assets_pos': [
            'l10n_ae_pos/static/src/**/*',
        ],
    },
    'auto_install': True,
}
