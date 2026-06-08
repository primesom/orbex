import { OrbexCorePlugin } from "@spreadsheet/plugins";
import { coreTypes, constants } from "@orbex/o-spreadsheet";
const { FIGURE_ID_SPLITTER } = constants;

/** Plugin that link charts with Orbex menus. It can contain either the Id of the orbex menu, or its xml id. */
export class ChartOrbexMenuPlugin extends OrbexCorePlugin {
    static getters = /** @type {const} */ (["getChartOrbexMenu"]);
    constructor(config) {
        super(config);
        this.orbexMenuReference = {};
    }

    /**
     * Handle a spreadsheet command
     * @param {Object} cmd Command
     */
    handle(cmd) {
        switch (cmd.type) {
            case "LINK_ORBEX_MENU_TO_CHART":
                this.history.update("orbexMenuReference", cmd.chartId, cmd.orbexMenuId);
                break;
            case "DELETE_CHART":
                this.history.update("orbexMenuReference", cmd.chartId, undefined);
                break;
            case "DUPLICATE_SHEET":
                this.updateOnDuplicateSheet(cmd.sheetId, cmd.sheetIdTo);
                break;
        }
    }

    updateOnDuplicateSheet(sheetIdFrom, sheetIdTo) {
        for (const oldChartId of this.getters.getChartIds(sheetIdFrom)) {
            const menu = this.orbexMenuReference[oldChartId];
            if (!menu) {
                continue;
            }
            const chartIdBase = oldChartId.split(FIGURE_ID_SPLITTER).pop();
            const newChartId = `${sheetIdTo}${FIGURE_ID_SPLITTER}${chartIdBase}`;
            this.history.update("orbexMenuReference", newChartId, menu);
        }
    }

    /**
     * Get orbex menu linked to the chart
     *
     * @param {string} chartId
     * @returns {object | undefined}
     */
    getChartOrbexMenu(chartId) {
        const menuId = this.orbexMenuReference[chartId];
        return menuId ? this.getters.getIrMenu(menuId) : undefined;
    }

    import(data) {
        if (data.chartOrbexMenusReferences) {
            this.orbexMenuReference = data.chartOrbexMenusReferences;
        }
    }

    export(data) {
        data.chartOrbexMenusReferences = this.orbexMenuReference;
    }
}

coreTypes.add("LINK_ORBEX_MENU_TO_CHART");
