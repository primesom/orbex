declare module "@spreadsheet" {
    import { Model } from "@orbex/o-spreadsheet";

    export interface OrbexSpreadsheetModel extends Model {
        getters: OrbexGetters;
        dispatch: OrbexDispatch;
    }

    export interface OrbexSpreadsheetModelConstructor {
        new (
            data: object,
            config: Partial<Model["config"]>,
            revisions: object[]
        ): OrbexSpreadsheetModel;
    }
}
