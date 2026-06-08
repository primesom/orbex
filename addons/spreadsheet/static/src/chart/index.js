import * as spreadsheet from "@orbex/o-spreadsheet";
import { OrbexChartCorePlugin } from "./plugins/orbex_chart_core_plugin";
import { ChartOrbexMenuPlugin } from "./plugins/chart_orbex_menu_plugin";
import { OrbexChartCoreViewPlugin } from "./plugins/orbex_chart_core_view_plugin";
import { _t } from "@web/core/l10n/translation";
import { chartOrbexMenuPlugin } from "./orbex_menu/orbex_menu_chartjs_plugin";

const { chartComponentRegistry, chartSubtypeRegistry, chartJsExtensionRegistry } =
    spreadsheet.registries;
const { ChartJsComponent, ZoomableChartJsComponent } = spreadsheet.components;

chartComponentRegistry.add("orbex_bar", ZoomableChartJsComponent);
chartComponentRegistry.add("orbex_line", ZoomableChartJsComponent);
chartComponentRegistry.add("orbex_pie", ChartJsComponent);
chartComponentRegistry.add("orbex_radar", ChartJsComponent);
chartComponentRegistry.add("orbex_sunburst", ChartJsComponent);
chartComponentRegistry.add("orbex_treemap", ChartJsComponent);
chartComponentRegistry.add("orbex_waterfall", ZoomableChartJsComponent);
chartComponentRegistry.add("orbex_pyramid", ChartJsComponent);
chartComponentRegistry.add("orbex_scatter", ChartJsComponent);
chartComponentRegistry.add("orbex_combo", ZoomableChartJsComponent);
chartComponentRegistry.add("orbex_geo", ChartJsComponent);
chartComponentRegistry.add("orbex_funnel", ChartJsComponent);

chartSubtypeRegistry.add("orbex_line", {
    matcher: (definition) =>
        definition.type === "orbex_line" && !definition.stacked && !definition.fillArea,
    subtypeDefinition: { stacked: false, fillArea: false },
    displayName: _t("Line"),
    chartSubtype: "orbex_line",
    chartType: "orbex_line",
    category: "line",
    preview: "o-spreadsheet-ChartPreview.LINE_CHART",
});
chartSubtypeRegistry.add("orbex_stacked_line", {
    matcher: (definition) =>
        definition.type === "orbex_line" && definition.stacked && !definition.fillArea,
    subtypeDefinition: { stacked: true, fillArea: false },
    displayName: _t("Stacked Line"),
    chartSubtype: "orbex_stacked_line",
    chartType: "orbex_line",
    category: "line",
    preview: "o-spreadsheet-ChartPreview.STACKED_LINE_CHART",
});
chartSubtypeRegistry.add("orbex_area", {
    matcher: (definition) =>
        definition.type === "orbex_line" && !definition.stacked && definition.fillArea,
    subtypeDefinition: { stacked: false, fillArea: true },
    displayName: _t("Area"),
    chartSubtype: "orbex_area",
    chartType: "orbex_line",
    category: "area",
    preview: "o-spreadsheet-ChartPreview.AREA_CHART",
});
chartSubtypeRegistry.add("orbex_stacked_area", {
    matcher: (definition) =>
        definition.type === "orbex_line" && definition.stacked && definition.fillArea,
    subtypeDefinition: { stacked: true, fillArea: true },
    displayName: _t("Stacked Area"),
    chartSubtype: "orbex_stacked_area",
    chartType: "orbex_line",
    category: "area",
    preview: "o-spreadsheet-ChartPreview.STACKED_AREA_CHART",
});
chartSubtypeRegistry.add("orbex_bar", {
    matcher: (definition) =>
        definition.type === "orbex_bar" && !definition.stacked && !definition.horizontal,
    subtypeDefinition: { stacked: false, horizontal: false },
    displayName: _t("Column"),
    chartSubtype: "orbex_bar",
    chartType: "orbex_bar",
    category: "column",
    preview: "o-spreadsheet-ChartPreview.COLUMN_CHART",
});
chartSubtypeRegistry.add("orbex_stacked_bar", {
    matcher: (definition) =>
        definition.type === "orbex_bar" && definition.stacked && !definition.horizontal,
    subtypeDefinition: { stacked: true, horizontal: false },
    displayName: _t("Stacked Column"),
    chartSubtype: "orbex_stacked_bar",
    chartType: "orbex_bar",
    category: "column",
    preview: "o-spreadsheet-ChartPreview.STACKED_COLUMN_CHART",
});
chartSubtypeRegistry.add("orbex_horizontal_bar", {
    matcher: (definition) =>
        definition.type === "orbex_bar" && !definition.stacked && definition.horizontal,
    subtypeDefinition: { stacked: false, horizontal: true },
    displayName: _t("Bar"),
    chartSubtype: "orbex_horizontal_bar",
    chartType: "orbex_bar",
    category: "bar",
    preview: "o-spreadsheet-ChartPreview.BAR_CHART",
});
chartSubtypeRegistry.add("orbex_horizontal_stacked_bar", {
    matcher: (definition) =>
        definition.type === "orbex_bar" && definition.stacked && definition.horizontal,
    subtypeDefinition: { stacked: true, horizontal: true },
    displayName: _t("Stacked Bar"),
    chartSubtype: "orbex_horizontal_stacked_bar",
    chartType: "orbex_bar",
    category: "bar",
    preview: "o-spreadsheet-ChartPreview.STACKED_BAR_CHART",
});
chartSubtypeRegistry.add("orbex_combo", {
    displayName: _t("Combo"),
    chartSubtype: "orbex_combo",
    chartType: "orbex_combo",
    category: "line",
    preview: "o-spreadsheet-ChartPreview.COMBO_CHART",
});
chartSubtypeRegistry.add("orbex_pie", {
    displayName: _t("Pie"),
    matcher: (definition) => definition.type === "orbex_pie" && !definition.isDoughnut,
    subtypeDefinition: { isDoughnut: false },
    chartSubtype: "orbex_pie",
    chartType: "orbex_pie",
    category: "pie",
    preview: "o-spreadsheet-ChartPreview.PIE_CHART",
});
chartSubtypeRegistry.add("orbex_doughnut", {
    matcher: (definition) => definition.type === "orbex_pie" && definition.isDoughnut,
    subtypeDefinition: { isDoughnut: true },
    displayName: _t("Doughnut"),
    chartSubtype: "orbex_doughnut",
    chartType: "orbex_pie",
    category: "pie",
    preview: "o-spreadsheet-ChartPreview.DOUGHNUT_CHART",
});
chartSubtypeRegistry.add("orbex_scatter", {
    displayName: _t("Scatter"),
    chartType: "orbex_scatter",
    chartSubtype: "orbex_scatter",
    category: "misc",
    preview: "o-spreadsheet-ChartPreview.SCATTER_CHART",
});
chartSubtypeRegistry.add("orbex_waterfall", {
    displayName: _t("Waterfall"),
    chartSubtype: "orbex_waterfall",
    chartType: "orbex_waterfall",
    category: "misc",
    preview: "o-spreadsheet-ChartPreview.WATERFALL_CHART",
});
chartSubtypeRegistry.add("orbex_pyramid", {
    displayName: _t("Population Pyramid"),
    chartSubtype: "orbex_pyramid",
    chartType: "orbex_pyramid",
    category: "misc",
    preview: "o-spreadsheet-ChartPreview.POPULATION_PYRAMID_CHART",
});
chartSubtypeRegistry.add("orbex_radar", {
    matcher: (definition) => definition.type === "orbex_radar" && !definition.fillArea,
    displayName: _t("Radar"),
    chartSubtype: "orbex_radar",
    chartType: "orbex_radar",
    subtypeDefinition: { fillArea: false },
    category: "misc",
    preview: "o-spreadsheet-ChartPreview.RADAR_CHART",
});
chartSubtypeRegistry.add("orbex_filled_radar", {
    matcher: (definition) => definition.type === "orbex_radar" && !!definition.fillArea,
    displayName: _t("Filled Radar"),
    chartType: "orbex_radar",
    chartSubtype: "orbex_filled_radar",
    subtypeDefinition: { fillArea: true },
    category: "misc",
    preview: "o-spreadsheet-ChartPreview.FILLED_RADAR_CHART",
});
chartSubtypeRegistry.add("orbex_geo", {
    displayName: _t("Geo chart"),
    chartType: "orbex_geo",
    chartSubtype: "orbex_geo",
    category: "misc",
    preview: "o-spreadsheet-ChartPreview.GEO_CHART",
});
chartSubtypeRegistry.add("orbex_funnel", {
    matcher: (definition) => definition.type === "orbex_funnel",
    displayName: _t("Funnel"),
    chartType: "orbex_funnel",
    chartSubtype: "orbex_funnel",
    subtypeDefinition: { cumulative: true },
    category: "misc",
    preview: "o-spreadsheet-ChartPreview.FUNNEL_CHART",
});
chartSubtypeRegistry.add("orbex_treemap", {
    displayName: _t("Treemap"),
    chartType: "orbex_treemap",
    chartSubtype: "orbex_treemap",
    category: "hierarchical",
    preview: "o-spreadsheet-ChartPreview.TREE_MAP_CHART",
});
chartSubtypeRegistry.add("orbex_sunburst", {
    displayName: _t("Sunburst"),
    chartType: "orbex_sunburst",
    chartSubtype: "orbex_sunburst",
    category: "hierarchical",
    preview: "o-spreadsheet-ChartPreview.SUNBURST_CHART",
});

chartJsExtensionRegistry.add("chartOrbexMenuPlugin", {
    register: (Chart) => Chart.register(chartOrbexMenuPlugin),
    unregister: (Chart) => Chart.unregister(chartOrbexMenuPlugin),
});

export { OrbexChartCorePlugin, ChartOrbexMenuPlugin, OrbexChartCoreViewPlugin };
