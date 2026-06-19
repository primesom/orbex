import { startWebClient } from "./start";
import { WebClientOrbex } from "./orbex/webclient/webclient";

/**
 * This file starts the webclient. It is in its own file to allow its replacement
 * in orbex. The Orbex version of the file uses its own webclient import,
 * which is a subclass of the above Webclient.
 */

startWebClient(WebClientOrbex);
