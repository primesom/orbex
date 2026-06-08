# Part of Orbex. See LICENSE file for full copyright and licensing details.

from unittest.mock import patch

from orbex.tests import tagged

from orbex.addons.payment.tests.http_common import PaymentHttpCommon
from orbex.addons.payment_demo.controllers.main import PaymentDemoController
from orbex.addons.payment_demo.tests.common import PaymentDemoCommon


@tagged('-at_install', 'post_install')
class TestProcessingFlows(PaymentDemoCommon, PaymentHttpCommon):

    def test_portal_payment_triggers_processing(self):
        """ Test that paying from the frontend triggers the processing of the payment data. """
        self._create_transaction(flow='direct')
        url = self._build_url(PaymentDemoController._simulation_url)
        with patch(
            'orbex.addons.payment.models.payment_transaction.PaymentTransaction._process'
        ) as process_mock:
            self.make_jsonrpc_request(url, params=self.payment_data)
        self.assertEqual(process_mock.call_count, 1)
