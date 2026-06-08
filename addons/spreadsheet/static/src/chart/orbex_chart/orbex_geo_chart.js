import { registries, chartHelpers } from "@orbex/o-spreadsheet";
import { _t } from "@web/core/l10n/translation";
import { OrbexChart } from "./orbex_chart";
import { onGeoOrbexChartItemHover, onGeoOrbexChartItemClick } from "./orbex_chart_helpers";

const { chartRegistry } = registries;

const {
    getGeoChartDatasets,
    CHART_COMMON_OPTIONS,
    getChartLayout,
    getChartTitle,
    getGeoChartScales,
    getGeoChartTooltip,
} = chartHelpers;

export class OrbexGeoChart extends OrbexChart {
    constructor(definition, sheetId, getters) {
        super(definition, sheetId, getters);
        this.colorScale = definition.colorScale;
        this.missingValueColor = definition.missingValueColor;
        this.region = definition.region;
    }

    getDefinition() {
        return {
            ...super.getDefinition(),
            colorScale: this.colorScale,
            missingValueColor: this.missingValueColor,
            region: this.region,
        };
    }
}

chartRegistry.add("orbex_geo", {
    match: (type) => type === "orbex_geo",
    createChart: (definition, sheetId, getters) => new OrbexGeoChart(definition, sheetId, getters),
    getChartRuntime: createOrbexChartRuntime,
    validateChartDefinition: (validator, definition) =>
        OrbexGeoChart.validateChartDefinition(validator, definition),
    transformDefinition: (definition) => OrbexGeoChart.transformDefinition(definition),
    getChartDefinitionFromContextCreation: () => OrbexGeoChart.getDefinitionFromContextCreation(),
    name: _t("Geo"),
});

function createOrbexChartRuntime(chart, getters) {
    const background = chart.background || "#FFFFFF";
    const { datasets, labels } = chart.dataSource.getData();

    const definition = chart.getDefinition();
    const locale = getters.getLocale();

    const chartData = {
        labels,
        dataSetsValues: datasets.map((ds) => ({ data: ds.data, label: ds.label })),
        locale,
        availableRegions: getters.getGeoChartAvailableRegions(),
        geoFeatureNameToId: getters.geoFeatureNameToId,
        getGeoJsonFeatures: getters.getGeoJsonFeatures,
    };

    const config = {
        type: "choropleth",
        data: {
            datasets: getGeoChartDatasets(definition, chartData),
        },
        options: {
            ...CHART_COMMON_OPTIONS,
            layout: getChartLayout(definition, chartData),
            scales: getGeoChartScales(definition, chartData),
            plugins: {
                title: getChartTitle(definition, getters),
                tooltip: getGeoChartTooltip(definition, chartData),
                legend: { display: false },
            },
            onHover: onGeoOrbexChartItemHover(),
            onClick: onGeoOrbexChartItemClick(getters, chart),
        },
    };

    return { background, chartJsConfig: config };
}
