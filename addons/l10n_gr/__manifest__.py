# -*- coding: utf-8 -*-
# Part of Orbex. See LICENSE file for full copyright and licensing details.

{
    'name': 'Greece - Accounting',
    'icon': '/account/static/description/l10n.png',
    'countries': ['gr'],
    'category': 'Accounting/Localizations/Account Charts',
    'description': """
This is the base module to manage the accounting chart for Greece.
==================================================================

Greek accounting chart and localization.
    """,
    'depends': [
        'account',
        'base_iban',
        'base_vat',
        'account_edi_ubl_cii',
    ],
    'auto_install': ['account'],
    'data': [
        'data/account_tax_report_data.xml',
    ],
    'demo': [
        'demo/demo_company.xml',
    ],
    'license': 'OSPL-1',
}
