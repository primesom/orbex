/**
 * This file is meant to load the different subparts of the module
 * to guarantee their plugins are loaded in the right order
 *
 * dependency:
 *             other plugins
 *                   |
 *                  ...
 *                   |
 *                filters
 *                /\    \
 *               /  \    \
 *           pivot  list  Orbex chart
 */

/** TODO: Introduce a position parameter to the plugin registry in order to load them in a specific order */
import * as spreadsheet from "@orbex/o-spreadsheet";
import { _t } from "@web/core/l10n/translation";

const { corePluginRegistry, coreViewsPluginRegistry, featurePluginRegistry } =
    spreadsheet.registries;

import {
    GlobalFiltersCorePlugin,
    GlobalFiltersUIPlugin,
    GlobalFiltersCoreViewPlugin,
} from "@spreadsheet/global_filters/index";
import {
    PivotOrbexCorePlugin,
    PivotCoreViewGlobalFilterPlugin,
    PivotUIGlobalFilterPlugin,
} from "@spreadsheet/pivot/index"; // list depends on filter for its getters
import { ListCorePlugin, ListCoreViewPlugin, ListUIPlugin } from "@spreadsheet/list/index"; // pivot depends on filter for its getters
import {
    ChartOrbexMenuPlugin,
    OrbexChartCorePlugin,
    OrbexChartCoreViewPlugin,
} from "@spreadsheet/chart/index"; // Orbexchart depends on filter for its getters
import { PivotCoreGlobalFilterPlugin } from "./pivot/plugins/pivot_core_global_filter_plugin";
import { PivotOrbexUIPlugin } from "./pivot/plugins/pivot_orbex_ui_plugin";
import { ListCoreGlobalFilterPlugin } from "./list/plugins/list_core_global_filter_plugin";
import { globalFieldMatchingRegistry } from "./global_filters/helpers";
import { OrbexChartFeaturePlugin } from "./chart/plugins/orbex_chart_feature_plugin";
import { LoggingUIPlugin } from "@spreadsheet/logging/logging_ui_plugin";

globalFieldMatchingRegistry.add("pivot", {
    getIds: (getters) =>
        getters
            .getPivotIds()
            .filter(
                (id) =>
                    getters.getPivotCoreDefinition(id).type === "ORBEX" &&
                    getters.getPivotFieldMatch(id)
            ),
    getDisplayName: (getters, pivotId) => getters.getPivotName(pivotId),
    getTag: (getters, pivotId) =>
        _t("Pivot #%(pivot_id)s", { pivot_id: getters.getPivotFormulaId(pivotId) }),
    getFieldMatching: (getters, pivotId, filterId) =>
        getters.getPivotFieldMatching(pivotId, filterId),
    getModel: (getters, pivotId) => {
        const pivot = getters.getPivotCoreDefinition(pivotId);
        return pivot.type === "ORBEX" && pivot.model;
    },
    waitForReady: (getters) =>
        getters
            .getPivotIds()
            .map((pivotId) => getters.getPivot(pivotId))
            .filter((pivot) => pivot.type === "ORBEX")
            .map((pivot) => pivot.loadMetadata()),
    getFields: (getters, pivotId) => getters.getPivot(pivotId).getFields(),
    getActionXmlId: (getters, pivotId) => getters.getPivotCoreDefinition(pivotId).actionXmlId,
});

globalFieldMatchingRegistry.add("list", {
    getIds: (getters) => getters.getListIds().filter((id) => getters.getListFieldMatch(id)),
    getDisplayName: (getters, listId) => getters.getListName(listId),
    getTag: (getters, listId) => _t(`List #%(list_id)s`, { list_id: listId }),
    getFieldMatching: (getters, listId, filterId) => getters.getListFieldMatching(listId, filterId),
    getModel: (getters, listId) => getters.getListDefinition(listId).model,
    waitForReady: (getters) =>
        getters.getListIds().map((listId) => getters.getListDataSource(listId).loadMetadata()),
    getFields: (getters, listId) => getters.getListDataSource(listId).getFields(),
    getActionXmlId: (getters, listId) => getters.getListDefinition(listId).actionXmlId,
});

globalFieldMatchingRegistry.add("chart", {
    getIds: (getters) => getters.getOrbexChartIds(),
    getDisplayName: (getters, chartId) => getters.getOrbexChartDisplayName(chartId),
    getFieldMatching: (getters, chartId, filterId) =>
        getters.getOrbexChartFieldMatching(chartId, filterId),
    getModel: (getters, chartId) =>
        getters.getChart(chartId).getDefinitionForDataSource().metaData.resModel,
    getTag: async (getters, chartId) => {
        const chartModel = await getters.getChartDataSource(chartId).getModelLabel();
        return _t("Chart - %(chart_model)s", { chart_model: chartModel });
    },
    waitForReady: (getters) =>
        getters
            .getOrbexChartIds()
            .map((chartId) => getters.getChartDataSource(chartId).loadMetadata()),
    getFields: (getters, chartId) => getters.getChartDataSource(chartId).getFields(),
    getActionXmlId: (getters, chartId) => getters.getChartDefinition(chartId).actionXmlId,
});

corePluginRegistry.add("OrbexGlobalFiltersCorePlugin", GlobalFiltersCorePlugin);
corePluginRegistry.add("PivotOrbexCorePlugin", PivotOrbexCorePlugin);
corePluginRegistry.add("OrbexPivotGlobalFiltersCorePlugin", PivotCoreGlobalFilterPlugin);
corePluginRegistry.add("OrbexListCorePlugin", ListCorePlugin);
corePluginRegistry.add("OrbexListCoreGlobalFilterPlugin", ListCoreGlobalFilterPlugin);
corePluginRegistry.add("orbexChartCorePlugin", OrbexChartCorePlugin);
corePluginRegistry.add("chartOrbexMenuPlugin", ChartOrbexMenuPlugin);

coreViewsPluginRegistry.add("OrbexGlobalFiltersCoreViewPlugin", GlobalFiltersCoreViewPlugin);
coreViewsPluginRegistry.add(
    "OrbexPivotGlobalFiltersCoreViewPlugin",
    PivotCoreViewGlobalFilterPlugin
);
coreViewsPluginRegistry.add("OrbexListCoreViewPlugin", ListCoreViewPlugin);
coreViewsPluginRegistry.add("OrbexChartCoreViewPlugin", OrbexChartCoreViewPlugin);
coreViewsPluginRegistry.add("OrbexLoggingUIPlugin", LoggingUIPlugin);

featurePluginRegistry.add("OrbexPivotGlobalFilterUIPlugin", PivotUIGlobalFilterPlugin);
featurePluginRegistry.add("OrbexGlobalFiltersUIPlugin", GlobalFiltersUIPlugin);
featurePluginRegistry.add("orbexPivotUIPlugin", PivotOrbexUIPlugin);
featurePluginRegistry.add("orbexListUIPlugin", ListUIPlugin);
featurePluginRegistry.add("OrbexChartFeaturePlugin", OrbexChartFeaturePlugin);
