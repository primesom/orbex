import { components } from "@orbex/o-spreadsheet";
import { patch } from "@web/core/utils/patch";

patch(components.ChartJsComponent.prototype, {
    createChart(chartData) {
        if (this.env.model.getters.isDashboard()) {
            chartData = this.addOrbexMenuPluginToChartData(chartData);
        }
        super.createChart(chartData);
    },
    updateChartJs(chartData) {
        if (this.env.model.getters.isDashboard()) {
            chartData = this.addOrbexMenuPluginToChartData(chartData);
        }
        super.updateChartJs(chartData);
    },
    addOrbexMenuPluginToChartData(chartData) {
        chartData.chartJsConfig.options.plugins.chartOrbexMenuPlugin = {
            env: this.env,
            menu: this.env.model.getters.getChartOrbexMenu(this.props.chartId),
        };
        return chartData;
    },
});
