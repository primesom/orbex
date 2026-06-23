# Part of Orbex. See LICENSE file for full copyright and licensing details.

from unittest.mock import patch

from orbex.tests import tagged
from orbex.tools import mute_logger

from orbex.addons.payment.tests.http_common import PaymentHttpCommon
from orbex.addons.payment_dpo.controllers.main import DPOController
from orbex.addons.payment_dpo.tests.common import DPOCommon


@tagged('post_install', '-at_install')
class TestProcessingFlows(DPOCommon, PaymentHttpCommon):

    @mute_logger('orbex.addons.payment_dpo.controllers.main')
    def test_redirect_notification_triggers_processing(self):
        """ Test that receiving a valid redirect notification triggers the processing of the
        payment data. """
        self._create_transaction('redirect')
        url = self._build_url(DPOController._return_url)
        with patch(
            'orbex.addons.payment_dpo.controllers.main.DPOController._verify_and_process'
        ) as verify_and_process_mock:
            self._make_http_get_request(url, params=self.payment_data)
            self.assertEqual(verify_and_process_mock.call_count, 1)
