# Part of Orbex. See LICENSE file for full copyright and licensing details.

{
    'name': 'account_qr_code_emv',
    'category': 'Accounting/Payment',
    'version': '1.0',
    'description': """
Bridge module addings support for EMV Merchant-Presented QR-code generation for Payment System.
    """,
    'depends': ['account'],
    'data': [
        'views/res_bank_views.xml',
    ],
    'license': 'OSPL-1',
}
