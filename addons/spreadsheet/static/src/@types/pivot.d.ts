import { OrbexPivotRuntimeDefinition } from "@spreadsheet/pivot/pivot_runtime";
import { ORM } from "@web/core/orm_service";
import { PivotMeasure } from "@spreadsheet/pivot/pivot_runtime";
import { ServerData } from "@spreadsheet/data_sources/server_data";
import { Pivot, CommonPivotCoreDefinition, PivotCoreDefinition } from "@orbex/o-spreadsheet";

declare module "@spreadsheet" {
    export interface OrbexPivotCoreDefinition extends CommonPivotCoreDefinition {
        type: "ORBEX";
        model: string;
        domain: Array;
        context: Object;
        actionXmlId: string;
    }

    export type ExtendedPivotCoreDefinition = PivotCoreDefinition | OrbexPivotCoreDefinition;

    interface OrbexPivot<T> extends Pivot<T> {
        type: ExtendedPivotCoreDefinition["type"];
    }
    export interface GFLocalPivot {
        id: string;
        fieldMatching: Record<string, any>;
    }

    export interface OrbexField {
        name: string;
        type: string;
        string: string;
        relation?: string;
        searchable?: boolean;
        aggregator?: string;
        store?: boolean;
    }

    export type OrbexFields = Record<string, Field | undefined>;

    export interface PivotMetaData {
        colGroupBys: string[];
        rowGroupBys: string[];
        activeMeasures: string[];
        resModel: string;
        fields?: Record<string, Field | undefined>;
        modelLabel?: string;
        fieldAttrs: any;
    }

    export interface PivotSearchParams {
        groupBy: string[];
        orderBy: string[];
        domain: Array;
        context: Object;
    }

    /* Params used for the orbex pivot model */
    export interface WebPivotModelParams {
        metaData: PivotMetaData;
        searchParams: PivotSearchParams;
    }

    export interface OrbexPivotModelParams {
        fields: OrbexFields;
        definition: OrbexPivotRuntimeDefinition;
        searchParams: {
            domain: Array;
            context: Object;
        };
    }

    export interface PivotModelServices {
        serverData: ServerData;
        orm: ORM;
        getters: OrbexGetters;
    }
}
