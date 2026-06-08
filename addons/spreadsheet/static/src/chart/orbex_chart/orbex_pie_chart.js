import { registries, chartHelpers } from "@orbex/o-spreadsheet";
import { _t } from "@web/core/l10n/translation";
import { OrbexChart } from "./orbex_chart";
import { onOrbexChartItemHover, onOrbexChartItemClick } from "./orbex_chart_helpers";

const { chartRegistry } = registries;

const {
    getPieChartDatasets,
    CHART_COMMON_OPTIONS,
    getChartLayout,
    getPieChartTooltip,
    getChartTitle,
    getPieChartLegend,
    getChartShowValues,
    getTopPaddingForDashboard,
} = chartHelpers;

export class OrbexPieChart extends OrbexChart {
    constructor(definition, sheetId, getters) {
        super(definition, sheetId, getters);
        this.isDoughnut = definition.isDoughnut;
    }

    getDefinition() {
        return {
            ...super.getDefinition(),
            isDoughnut: this.isDoughnut,
        };
    }
}

chartRegistry.add("orbex_pie", {
    match: (type) => type === "orbex_pie",
    createChart: (definition, sheetId, getters) => new OrbexPieChart(definition, sheetId, getters),
    getChartRuntime: createOrbexChartRuntime,
    validateChartDefinition: (validator, definition) =>
        OrbexPieChart.validateChartDefinition(validator, definition),
    transformDefinition: (definition) => OrbexPieChart.transformDefinition(definition),
    getChartDefinitionFromContextCreation: () => OrbexPieChart.getDefinitionFromContextCreation(),
    name: _t("Pie"),
});

function createOrbexChartRuntime(chart, getters) {
    const background = chart.background || "#FFFFFF";
    const { datasets, labels } = chart.dataSource.getData();
    const definition = chart.getDefinition();
    definition.dataSets = datasets.map(() => ({ trend: definition.trend }));

    const chartData = {
        labels,
        dataSetsValues: datasets.map((ds) => ({ data: ds.data, label: ds.label })),
        locale: getters.getLocale(),
        topPadding: getTopPaddingForDashboard(definition, getters),
    };

    const config = {
        type: definition.isDoughnut ? "doughnut" : "pie",
        data: {
            labels: chartData.labels,
            datasets: getPieChartDatasets(definition, chartData),
        },
        options: {
            ...CHART_COMMON_OPTIONS,
            layout: getChartLayout(definition, chartData),
            plugins: {
                title: getChartTitle(definition, getters),
                legend: getPieChartLegend(definition, chartData),
                tooltip: getPieChartTooltip(definition, chartData),
                chartShowValuesPlugin: getChartShowValues(definition, chartData),
            },
            onHover: onOrbexChartItemHover(),
            onClick: onOrbexChartItemClick(getters, chart),
        },
    };

    return { background, chartJsConfig: config };
}
