import { createWebClient } from "@web/../tests/webclient/helpers";
import { WebClientOrbex } from "@web/orbex/webclient/webclient";

export function createOrbexWebClient(params) {
    params.WebClientClass = WebClientOrbex;
    return createWebClient(params);
}
