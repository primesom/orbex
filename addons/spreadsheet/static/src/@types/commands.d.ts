import { FieldMatching } from "./global_filter.d";
import {
    CorePlugin,
    UIPlugin,
    DispatchResult,
    CommandResult,
    AddPivotCommand,
    UpdatePivotCommand,
    CancelledReason,
} from "@orbex/o-spreadsheet";
import * as OrbexCancelledReason from "@spreadsheet/o_spreadsheet/cancelled_reason";

type CoreDispatch = CorePlugin["dispatch"];
type UIDispatch = UIPlugin["dispatch"];
type CoreCommand = Parameters<CorePlugin["allowDispatch"]>[0];
type Command = Parameters<UIPlugin["allowDispatch"]>[0];

// TODO look for a way to remove this and use the real import * as OrbexCancelledReason
type OrbexCancelledReason = string;

declare module "@spreadsheet" {
    interface OrbexCommandDispatcher {
        dispatch<T extends OrbexCommandTypes, C extends Extract<OrbexCommand, { type: T }>>(
            type: {} extends Omit<C, "type"> ? T : never
        ): OrbexDispatchResult;
        dispatch<T extends OrbexCommandTypes, C extends Extract<OrbexCommand, { type: T }>>(
            type: T,
            r: Omit<C, "type">
        ): OrbexDispatchResult;
    }

    interface OrbexCoreCommandDispatcher {
        dispatch<T extends OrbexCoreCommandTypes, C extends Extract<OrbexCoreCommand, { type: T }>>(
            type: {} extends Omit<C, "type"> ? T : never
        ): OrbexDispatchResult;
        dispatch<T extends OrbexCoreCommandTypes, C extends Extract<OrbexCoreCommand, { type: T }>>(
            type: T,
            r: Omit<C, "type">
        ): OrbexDispatchResult;
    }

    interface OrbexDispatchResult extends DispatchResult {
        readonly reasons: (CancelledReason | OrbexCancelledReason)[];
        isCancelledBecause(reason: CancelledReason | OrbexCancelledReason): boolean;
    }

    type OrbexCommandTypes = OrbexCommand["type"];
    type OrbexCoreCommandTypes = OrbexCoreCommand["type"];

    type OrbexDispatch = UIDispatch & OrbexCommandDispatcher["dispatch"];
    type OrbexCoreDispatch = CoreDispatch & OrbexCoreCommandDispatcher["dispatch"];

    // CORE

    export interface ExtendedAddPivotCommand extends AddPivotCommand {
        pivot: ExtendedPivotCoreDefinition;
    }

    export interface ExtendedUpdatePivotCommand extends UpdatePivotCommand {
        pivot: ExtendedPivotCoreDefinition;
    }

    export interface AddThreadCommand {
        type: "ADD_COMMENT_THREAD";
        threadId: number;
        sheetId: string;
        col: number;
        row: number;
    }

    export interface EditThreadCommand {
        type: "EDIT_COMMENT_THREAD";
        threadId: number;
        sheetId: string;
        col: number;
        row: number;
        isResolved: boolean;
    }

    export interface DeleteThreadCommand {
        type: "DELETE_COMMENT_THREAD";
        threadId: number;
        sheetId: string;
        col: number;
        row: number;
    }

    // this command is deprecated. use UPDATE_PIVOT instead
    export interface UpdatePivotDomainCommand {
        type: "UPDATE_ORBEX_PIVOT_DOMAIN";
        pivotId: string;
        domain: Array;
    }

    export interface AddGlobalFilterCommand {
        type: "ADD_GLOBAL_FILTER";
        filter: CmdGlobalFilter;
        [string]: any; // Fields matching
    }

    export interface EditGlobalFilterCommand {
        type: "EDIT_GLOBAL_FILTER";
        filter: CmdGlobalFilter;
        [string]: any; // Fields matching
    }

    export interface RemoveGlobalFilterCommand {
        type: "REMOVE_GLOBAL_FILTER";
        id: string;
    }

    export interface MoveGlobalFilterCommand {
        type: "MOVE_GLOBAL_FILTER";
        id: string;
        delta: number;
    }

    // UI

    export interface RefreshAllDataSourcesCommand {
        type: "REFRESH_ALL_DATA_SOURCES";
    }

    export interface SetGlobalFilterValueCommand {
        type: "SET_GLOBAL_FILTER_VALUE";
        id: string;
        value: any;
    }

    export interface SetManyGlobalFilterValueCommand {
        type: "SET_MANY_GLOBAL_FILTER_VALUE";
        filters: { filterId: string; value: any }[];
    }

    type OrbexCoreCommand =
        | ExtendedAddPivotCommand
        | ExtendedUpdatePivotCommand
        | UpdatePivotDomainCommand
        | AddThreadCommand
        | DeleteThreadCommand
        | EditThreadCommand
        | AddGlobalFilterCommand
        | EditGlobalFilterCommand
        | RemoveGlobalFilterCommand
        | MoveGlobalFilterCommand;

    export type AllCoreCommand = OrbexCoreCommand | CoreCommand;

    type OrbexLocalCommand =
        | RefreshAllDataSourcesCommand
        | SetGlobalFilterValueCommand
        | SetManyGlobalFilterValueCommand;

    type OrbexCommand = OrbexCoreCommand | OrbexLocalCommand;

    export type AllCommand = OrbexCommand | Command;
}
