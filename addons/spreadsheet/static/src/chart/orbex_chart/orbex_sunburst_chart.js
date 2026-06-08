import { registries, chartHelpers } from "@orbex/o-spreadsheet";
import { _t } from "@web/core/l10n/translation";
import { OrbexChart } from "./orbex_chart";
import { onOrbexChartItemHover, onSunburstOrbexChartItemClick } from "./orbex_chart_helpers";

const { chartRegistry } = registries;

const {
    getSunburstChartDatasets,
    CHART_COMMON_OPTIONS,
    getChartLayout,
    getChartTitle,
    getSunburstShowValues,
    getSunburstChartLegend,
    getSunburstChartTooltip,
} = chartHelpers;

export class OrbexSunburstChart extends OrbexChart {
    constructor(definition, sheetId, getters) {
        super(definition, sheetId, getters);
        this.showLabels = definition.showLabels;
        this.valuesDesign = definition.valuesDesign;
        this.groupColors = definition.groupColors;
        this.pieHolePercentage = definition.pieHolePercentage;
    }

    getDefinition() {
        return {
            ...super.getDefinition(),
            pieHolePercentage: this.pieHolePercentage,
            showLabels: this.showLabels,
            valuesDesign: this.valuesDesign,
            groupColors: this.groupColors,
        };
    }
}

chartRegistry.add("orbex_sunburst", {
    match: (type) => type === "orbex_sunburst",
    createChart: (definition, sheetId, getters) =>
        new OrbexSunburstChart(definition, sheetId, getters),
    getChartRuntime: createOrbexChartRuntime,
    validateChartDefinition: (validator, definition) =>
        OrbexSunburstChart.validateChartDefinition(validator, definition),
    transformDefinition: (definition) => OrbexSunburstChart.transformDefinition(definition),
    getChartDefinitionFromContextCreation: () =>
        OrbexSunburstChart.getDefinitionFromContextCreation(),
    name: _t("Sunburst"),
});

function createOrbexChartRuntime(chart, getters) {
    const background = chart.background || "#FFFFFF";
    const { datasets, labels } = chart.dataSource.getHierarchicalData();

    const definition = chart.getDefinition();
    const locale = getters.getLocale();

    const chartData = {
        labels,
        dataSetsValues: datasets.map((ds) => ({ data: ds.data, label: ds.label })),
        locale,
    };

    const config = {
        type: "doughnut",
        data: {
            labels: chartData.labels,
            datasets: getSunburstChartDatasets(definition, chartData),
        },
        options: {
            ...CHART_COMMON_OPTIONS,
            cutout: chart.pieHolePercentage === undefined ? "25%" : `${chart.pieHolePercentage}%`,
            layout: getChartLayout(definition, chartData),
            plugins: {
                title: getChartTitle(definition, getters),
                legend: getSunburstChartLegend(definition, chartData),
                tooltip: getSunburstChartTooltip(definition, chartData),
                sunburstLabelsPlugin: getSunburstShowValues(definition, chartData),
                sunburstHoverPlugin: { enabled: true },
            },
            onHover: onOrbexChartItemHover(),
            onClick: onSunburstOrbexChartItemClick(getters, chart),
        },
    };

    return { background, chartJsConfig: config };
}
