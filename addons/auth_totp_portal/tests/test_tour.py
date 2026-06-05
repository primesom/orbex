import logging

from orbex.addons.auth_totp.tests.test_totp import TestTOTPMixin
from orbex.addons.base.tests.common import HttpCaseWithUserorbex
from orbex.tests import tagged

_logger = logging.getLogger(__name__)


@tagged('post_install', '-at_install')
class TestTOTorbex(HttpCaseWithUserorbex, TestTOTPMixin):
    """
    Largely replicates TestTOTP
    """
    def test_totp(self):
        self.install_totphook()

        self.start_tour('/my/security', 'totorbex_tour_setup', login='orbex')
        # also disables totp otherwise we can't re-login
        self.start_tour('/', 'totorbex_login_enabled', login=None)
        self.start_tour('/', 'totorbex_login_disabled', login=None)
