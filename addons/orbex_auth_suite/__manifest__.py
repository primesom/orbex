# Part of Orbex. See LICENSE file for full copyright and licensing details.

{
    'name': 'Orbex Authentication Suite',
    'summary': 'Installs Orbex authentication, signup, password policy, passkey, OAuth, LDAP, and timeout features.',
    'category': 'Hidden/Tools',
    'version': '1.0',
    'depends': [
        'auth_ldap',
        'auth_oauth',
        'auth_passkey_portal',
        'auth_password_policy_portal',
        'auth_password_policy_signup',
        'auth_timeout',
        'auth_totp_portal',
    ],
    'data': [],
    'installable': True,
    'application': False,
    'license': 'OSPL-1',
}
