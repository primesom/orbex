import { registries, chartHelpers } from "@orbex/o-spreadsheet";
import { _t } from "@web/core/l10n/translation";
import { OrbexChart } from "./orbex_chart";
import { onOrbexChartItemHover, onOrbexChartItemClick } from "./orbex_chart_helpers";

const { chartRegistry } = registries;

const {
    getComboChartDatasets,
    CHART_COMMON_OPTIONS,
    getChartLayout,
    getBarChartScales,
    getBarChartTooltip,
    getChartTitle,
    getComboChartLegend,
    getChartShowValues,
    getTrendDatasetForBarChart,
} = chartHelpers;

export class OrbexComboChart extends OrbexChart {
    constructor(definition, sheetId, getters) {
        super(definition, sheetId, getters);
        this.axesDesign = definition.axesDesign;
        this.hideDataMarkers = definition.hideDataMarkers;
        this.zoomable = definition.zoomable;
    }

    getDefinition() {
        return {
            ...super.getDefinition(),
            axesDesign: this.axesDesign,
            hideDataMarkers: this.hideDataMarkers,
            zoomable: this.zoomable,
        };
    }

    get dataSets() {
        const dataSets = super.dataSets;
        if (dataSets.every((ds) => !ds.type)) {
            return dataSets.map((ds, index) => ({
                ...ds,
                type: index === 0 ? "bar" : "line",
            }));
        }
        return dataSets;
    }
}

chartRegistry.add("orbex_combo", {
    match: (type) => type === "orbex_combo",
    createChart: (definition, sheetId, getters) => new OrbexComboChart(definition, sheetId, getters),
    getChartRuntime: createOrbexChartRuntime,
    validateChartDefinition: (validator, definition) =>
        OrbexComboChart.validateChartDefinition(validator, definition),
    transformDefinition: (definition) => OrbexComboChart.transformDefinition(definition),
    getChartDefinitionFromContextCreation: () => OrbexComboChart.getDefinitionFromContextCreation(),
    name: _t("Combo"),
});

function createOrbexChartRuntime(chart, getters) {
    const background = chart.background || "#FFFFFF";
    const { datasets, labels } = chart.dataSource.getData();
    const definition = chart.getDefinition();

    const trendDataSetsValues = datasets.map((dataset, index) => {
        const trend = definition.dataSets[index]?.trend;
        return !trend?.display || chart.horizontal
            ? undefined
            : getTrendDatasetForBarChart(trend, dataset.data);
    });

    const chartData = {
        labels,
        dataSetsValues: datasets.map((ds) => ({ data: ds.data, label: ds.label })),
        locale: getters.getLocale(),
        trendDataSetsValues,
    };

    const config = {
        type: "bar",
        data: {
            labels: chartData.labels,
            datasets: getComboChartDatasets(definition, chartData),
        },
        options: {
            ...CHART_COMMON_OPTIONS,
            layout: getChartLayout(definition, chartData),
            scales: getBarChartScales(definition, chartData),
            plugins: {
                title: getChartTitle(definition, getters),
                legend: getComboChartLegend(definition, chartData),
                tooltip: getBarChartTooltip(definition, chartData),
                chartShowValuesPlugin: getChartShowValues(definition, chartData),
            },
            onHover: onOrbexChartItemHover(),
            onClick: onOrbexChartItemClick(getters, chart),
        },
    };

    return { background, chartJsConfig: config };
}
