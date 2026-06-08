import orbex as orbex
import orbex.tests
from orbex.tools import mute_logger


@orbex.tests.common.tagged('post_install', '-at_install')
class TestWebsiteError(orbex.tests.HttpCase):

    @mute_logger('orbex.addons.http_routing.models.ir_http', 'orbex.http')
    def test_01_run_test(self):
        self.start_tour("/test_error_view", 'test_error_website')
