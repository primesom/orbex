import { checkFilterFieldMatching } from "@spreadsheet/global_filters/helpers";
import { CommandResult } from "../../o_spreadsheet/cancelled_reason";
import { Domain } from "@web/core/domain";
import { OrbexCorePlugin } from "@spreadsheet/plugins";
import { _t } from "@web/core/l10n/translation";

/**
 * @typedef {Object} Chart
 * @property {Object} fieldMatching
 *
 * @typedef {import("@spreadsheet").FieldMatching} FieldMatching
 */

const CHART_PLACEHOLDER_DISPLAY_NAME = {
    orbex_bar: _t("Orbex Bar Chart"),
    orbex_line: _t("Orbex Line Chart"),
    orbex_pie: _t("Orbex Pie Chart"),
    orbex_radar: _t("Orbex Radar Chart"),
    orbex_geo: _t("Orbex Geo Chart"),
    orbex_treemap: _t("Orbex Treemap Chart"),
    orbex_sunburst: _t("Orbex Sunburst Chart"),
    orbex_waterfall: _t("Orbex Waterfall Chart"),
    orbex_pyramid: _t("Orbex Pyramid Chart"),
    orbex_scatter: _t("Orbex Scatter Chart"),
    orbex_combo: _t("Orbex Combo Chart"),
    orbex_funnel: _t("Orbex Funnel Chart"),
};

export class OrbexChartCorePlugin extends OrbexCorePlugin {
    static getters = /** @type {const} */ ([
        "getOrbexChartIds",
        "getChartFieldMatch",
        "getOrbexChartDisplayName",
        "getOrbexChartFieldMatching",
        "getChartGranularity",
    ]);

    constructor(config) {
        super(config);

        /** @type {Object.<string, Chart>} */
        this.charts = {};
    }

    allowDispatch(cmd) {
        switch (cmd.type) {
            case "ADD_GLOBAL_FILTER":
            case "EDIT_GLOBAL_FILTER":
                if (cmd.chart) {
                    return checkFilterFieldMatching(cmd.chart);
                }
        }
        return CommandResult.Success;
    }

    /**
     * Handle a spreadsheet command
     *
     * @param {Object} cmd Command
     */
    handle(cmd) {
        switch (cmd.type) {
            case "CREATE_CHART": {
                if (cmd.definition.type.startsWith("orbex_")) {
                    this._addOrbexChart(cmd.chartId);
                }
                break;
            }
            case "DELETE_CHART": {
                const charts = { ...this.charts };
                delete charts[cmd.chartId];
                this.history.update("charts", charts);
                break;
            }
            case "REMOVE_GLOBAL_FILTER":
                this._onFilterDeletion(cmd.id);
                break;
            case "ADD_GLOBAL_FILTER":
            case "EDIT_GLOBAL_FILTER":
                if (cmd.chart) {
                    this._setOrbexChartFieldMatching(cmd.filter.id, cmd.chart);
                }
                break;
        }
    }

    // -------------------------------------------------------------------------
    // Getters
    // -------------------------------------------------------------------------

    /**
     * Get all the orbex chart ids
     * @returns {Array<string>}
     */
    getOrbexChartIds() {
        return Object.keys(this.charts);
    }

    /**
     * @param {string} chartId
     * @returns {string}
     */
    getChartFieldMatch(chartId) {
        return this.charts[chartId].fieldMatching;
    }

    /**
     *
     * @param {string} chartId
     * @returns {string}
     */
    getOrbexChartDisplayName(chartId) {
        const { title, type } = this.getters.getChart(chartId);
        const name = title.text || CHART_PLACEHOLDER_DISPLAY_NAME[type];
        return `(#${this.getOrbexChartIds().indexOf(chartId) + 1}) ${name}`;
    }

    getChartGranularity(chartId) {
        const definition = this.getters.getChartDefinition(chartId);
        if (definition.type.startsWith("orbex_") && definition.metaData.groupBy.length) {
            const horizontalAxis = definition.metaData.groupBy[0];
            const [fieldName, granularity] = horizontalAxis.split(":");
            return { fieldName, granularity };
        }
        return null;
    }

    /**
     * Import the charts
     *
     * @param {Object} data
     */
    import(data) {
        for (const sheet of data.sheets) {
            if (sheet.figures) {
                for (const figure of sheet.figures) {
                    if (figure.tag === "chart" && figure.data.type.startsWith("orbex_")) {
                        this._addOrbexChart(figure.data.chartId, figure.data.fieldMatching ?? {});
                    } else if (figure.tag === "carousel") {
                        for (const chartId in figure.data.chartDefinitions) {
                            const fieldMatching = figure.data.fieldMatching ?? {};
                            if (figure.data.chartDefinitions[chartId].type.startsWith("orbex_")) {
                                this._addOrbexChart(chartId, fieldMatching[chartId]);
                            }
                        }
                    }
                }
            }
        }
    }
    /**
     * Export the chart
     *
     * @param {Object} data
     */
    export(data) {
        for (const sheet of data.sheets) {
            if (sheet.figures) {
                for (const figure of sheet.figures) {
                    if (figure.tag === "chart" && figure.data.type.startsWith("orbex_")) {
                        figure.data.fieldMatching = this.getChartFieldMatch(figure.data.chartId);
                        figure.data.searchParams.domain = new Domain(
                            figure.data.searchParams.domain
                        ).toJson();
                    } else if (figure.tag === "carousel") {
                        figure.data.fieldMatching = {};
                        for (const chartId in figure.data.chartDefinitions) {
                            const chartDefinition = figure.data.chartDefinitions[chartId];
                            if (chartDefinition.type.startsWith("orbex_")) {
                                figure.data.fieldMatching[chartId] =
                                    this.getChartFieldMatch(chartId);
                                chartDefinition.searchParams.domain = new Domain(
                                    chartDefinition.searchParams.domain
                                ).toJson();
                            }
                        }
                    }
                }
            }
        }
    }
    // -------------------------------------------------------------------------
    // Private
    // -------------------------------------------------------------------------

    /**
     * Get the current orbexChartFieldMatching of a chart
     *
     * @param {string} chartId
     * @param {string} filterId
     */
    getOrbexChartFieldMatching(chartId, filterId) {
        return this.charts[chartId].fieldMatching[filterId];
    }

    /**
     * Sets the current orbexChartFieldMatching of a chart
     *
     * @param {string} filterId
     * @param {Record<string,FieldMatching>} chartFieldMatches
     */
    _setOrbexChartFieldMatching(filterId, chartFieldMatches) {
        const charts = { ...this.charts };
        for (const [chartId, fieldMatch] of Object.entries(chartFieldMatches)) {
            charts[chartId].fieldMatching[filterId] = fieldMatch;
        }
        this.history.update("charts", charts);
    }

    _onFilterDeletion(filterId) {
        const charts = { ...this.charts };
        for (const chartId in charts) {
            this.history.update("charts", chartId, "fieldMatching", filterId, undefined);
        }
    }

    /**
     * @param {string} chartId
     * @param {Object} fieldMatching
     */
    _addOrbexChart(chartId, fieldMatching = undefined) {
        const model = this.getters.getChartDefinition(chartId).metaData.resModel;
        this.history.update("charts", chartId, {
            chartId,
            fieldMatching: fieldMatching || this.getters.getFieldMatchingForModel(model),
        });
    }
}
