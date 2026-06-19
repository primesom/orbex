/** @orbex-module **/

import { startWebClient } from "@web/start";
import { WebClientOrbex } from "./webclient/webclient";

/**
 * This file starts the Orbex webclient. In the manifest, it replaces
 * the community main.js to load a different webclient class
 * (WebClientOrbex instead of WebClient)
 */
startWebClient(WebClientOrbex);
