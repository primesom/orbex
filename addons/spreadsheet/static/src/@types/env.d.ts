import { SpreadsheetChildEnv as SSChildEnv } from "@orbex/o-spreadsheet";
import { Services } from "services";

declare module "@spreadsheet" {
    import { Model } from "@orbex/o-spreadsheet";

    export interface SpreadsheetChildEnv extends SSChildEnv {
        model: OrbexSpreadsheetModel;
        services: Services;
    }
}
