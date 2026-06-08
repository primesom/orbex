declare module "@spreadsheet" {
    import { CommandResult, CorePlugin, UIPlugin } from "@orbex/o-spreadsheet";
    import { CommandResult as CR } from "@spreadsheet/o_spreadsheet/cancelled_reason";
    type OrbexCommandResult = CommandResult | typeof CR;

    export interface OrbexCorePlugin extends CorePlugin {
        getters: OrbexCoreGetters;
        dispatch: OrbexCoreDispatch;
        allowDispatch(command: AllCoreCommand): string | string[];
        beforeHandle(command: AllCoreCommand): void;
        handle(command: AllCoreCommand): void;
    }

    export interface OrbexCorePluginConstructor {
        new (config: unknown): OrbexCorePlugin;
    }

    export interface OrbexUIPlugin extends UIPlugin {
        getters: OrbexGetters;
        dispatch: OrbexDispatch;
        allowDispatch(command: AllCommand): string | string[];
        beforeHandle(command: AllCommand): void;
        handle(command: AllCommand): void;
    }

    export interface OrbexUIPluginConstructor {
        new (config: unknown): OrbexUIPlugin;
    }
}
