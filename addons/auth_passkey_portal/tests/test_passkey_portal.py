from orbex import Command
from orbex.exceptions import AccessError
from orbex.tests import tagged
from orbex.tools import SQL
from orbex.addons.auth_passkey.tests.test_passkey_demo import PasskeyTest


@tagged('post_install', '-at_install')
class PasskeyTestorbex(PasskeyTest):
    @classmethod
    def setUpClass(self):
        super().setUpClass()
        login = 'passkey_orbex'
        self.orbex_user = self.env['res.users'].create({
            'name': login,
            'login': login,
            'password': login,
            'group_ids': [Command.set([self.env.ref('base.group_orbex').id])],
        })

    def test_passkey_orbex_create(self):
        self.env['ir.config_parameter'].sudo().set_param('web.base.url', self.passkeys['test-yubikey']['host'])
        self.admin_user.auth_passkey_key_ids.unlink()
        with self.patch_start_registration(self.passkeys['test-yubikey']['registration']['challenge']):
            self.start_tour("/my/security?debug=tests", 'passkeys_orbex_create', login="passkey_orbex")

    def test_passkey_orbex_rename(self):
        orbex_passkey = self.env['auth.passkey.key'].search([('name', '=', 'test-keepassxc')])
        self.env.cr.execute(SQL("UPDATE auth_passkey_key SET create_uid = %s WHERE id = %s", self.orbex_user.id, orbex_passkey.id))
        self.start_tour("/my/security?debug=tests", 'passkeys_orbex_rename', login='passkey_orbex')

    def test_passkey_orbex_delete(self):
        orbex_passkey = self.env['auth.passkey.key'].search([('name', '=', 'test-keepassxc')])
        self.env.cr.execute(SQL("UPDATE auth_passkey_key SET create_uid = %s WHERE id = %s", self.orbex_user.id, orbex_passkey.id))
        self.start_tour("/my/security?debug=tests", 'passkeys_orbex_delete', login='passkey_orbex')

    def test_orbex_permissions(self):
        admin_passkey = self.env['auth.passkey.key'].search([('name', '=', 'test-yubikey-nano')])
        with self.assertRaises(AccessError):
            admin_passkey.with_user(self.orbex_user).write({'name': 'test'})
