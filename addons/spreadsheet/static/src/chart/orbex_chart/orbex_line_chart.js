import { registries, chartHelpers } from "@orbex/o-spreadsheet";
import { _t } from "@web/core/l10n/translation";
import { OrbexChart } from "./orbex_chart";
import { onOrbexChartItemClick, onOrbexChartItemHover } from "./orbex_chart_helpers";

const { chartRegistry } = registries;

const {
    getLineChartDatasets,
    CHART_COMMON_OPTIONS,
    getChartLayout,
    getLineChartScales,
    getLineChartTooltip,
    getChartTitle,
    getLineChartLegend,
    getChartShowValues,
    getTrendDatasetForLineChart,
    getTopPaddingForDashboard,
} = chartHelpers;

export class OrbexLineChart extends OrbexChart {
    constructor(definition, sheetId, getters) {
        super(definition, sheetId, getters);
        this.verticalAxisPosition = definition.verticalAxisPosition;
        this.stacked = definition.stacked;
        this.cumulative = definition.cumulative;
        this.cumulatedStart = definition.cumulatedStart;
        this.axesDesign = definition.axesDesign;
        this.fillArea = definition.fillArea;
        this.cumulatedStart = definition.cumulatedStart;
        this.hideDataMarkers = definition.hideDataMarkers;
        this.zoomable = definition.zoomable;
    }

    getDefinition() {
        return {
            ...super.getDefinition(),
            verticalAxisPosition: this.verticalAxisPosition,
            stacked: this.stacked,
            cumulative: this.cumulative,
            cumulatedStart: this.cumulatedStart,
            axesDesign: this.axesDesign,
            fillArea: this.fillArea,
            hideDataMarkers: this.hideDataMarkers,
            zoomable: this.zoomable,
        };
    }
}

chartRegistry.add("orbex_line", {
    match: (type) => type === "orbex_line",
    createChart: (definition, sheetId, getters) => new OrbexLineChart(definition, sheetId, getters),
    getChartRuntime: createOrbexChartRuntime,
    validateChartDefinition: (validator, definition) =>
        OrbexLineChart.validateChartDefinition(validator, definition),
    transformDefinition: (definition) => OrbexLineChart.transformDefinition(definition),
    getChartDefinitionFromContextCreation: () => OrbexLineChart.getDefinitionFromContextCreation(),
    name: _t("Line"),
});

function createOrbexChartRuntime(chart, getters) {
    const background = chart.background || "#FFFFFF";
    let { datasets, labels } = chart.dataSource.getData();
    datasets = computeCumulatedDatasets(chart, datasets);

    const definition = chart.getDefinition();
    const locale = getters.getLocale();

    const trendDataSetsValues = datasets.map((dataset, index) => {
        const trend = definition.dataSets[index]?.trend;
        return !trend?.display
            ? undefined
            : getTrendDatasetForLineChart(trend, dataset.data, labels, "category", locale);
    });

    const chartData = {
        labels,
        dataSetsValues: datasets.map((ds) => ({ data: ds.data, label: ds.label })),
        locale,
        trendDataSetsValues,
        topPadding: getTopPaddingForDashboard(definition, getters),
        axisType: definition.axisType || "category",
    };

    const chartJsDatasets = getLineChartDatasets(definition, chartData);
    const config = {
        type: "line",
        data: {
            labels: chartData.labels,
            datasets: chartJsDatasets,
        },
        options: {
            ...CHART_COMMON_OPTIONS,
            layout: getChartLayout(definition, chartData),
            scales: getLineChartScales(definition, chartData),
            plugins: {
                title: getChartTitle(definition, getters),
                legend: getLineChartLegend(definition, chartData),
                tooltip: getLineChartTooltip(definition, chartData),
                chartShowValuesPlugin: getChartShowValues(definition, chartData),
            },
            onHover: onOrbexChartItemHover(),
            onClick: onOrbexChartItemClick(getters, chart),
        },
    };

    return { background, chartJsConfig: config };
}

function computeCumulatedDatasets(chart, datasets) {
    const cumulatedDatasets = [];
    for (const dataset of datasets) {
        if (chart.cumulative) {
            let accumulator = dataset.cumulatedStart || 0;
            const data = dataset.data.map((value) => {
                accumulator += value;
                return accumulator;
            });
            cumulatedDatasets.push({ ...dataset, data });
        } else {
            cumulatedDatasets.push(dataset);
        }
    }
    return cumulatedDatasets;
}
