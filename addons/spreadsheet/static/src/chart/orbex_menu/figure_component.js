import { patch } from "@web/core/utils/patch";
import * as spreadsheet from "@orbex/o-spreadsheet";
import { useService } from "@web/core/utils/hooks";
import { navigateToOrbexMenu } from "../orbex_chart/orbex_chart_helpers";

patch(spreadsheet.components.FigureComponent.prototype, {
    setup() {
        super.setup();
        this.actionService = useService("action");
        this.notificationService = useService("notification");
    },
    get chartId() {
        if (this.props.figureUI.tag !== "chart" && this.props.figureUI.tag !== "carousel") {
            return undefined;
        }
        return this.env.model.getters.getChartIdFromFigureId(this.props.figureUI.id);
    },
    async navigateToOrbexMenu(newWindow) {
        const menu = this.env.model.getters.getChartOrbexMenu(this.chartId);
        await navigateToOrbexMenu(menu, this.actionService, this.notificationService, newWindow);
    },
    get hasOrbexMenu() {
        return this.chartId && this.env.model.getters.getChartOrbexMenu(this.chartId) !== undefined;
    },
});

patch(spreadsheet.components.ScorecardChart.prototype, {
    setup() {
        super.setup();
        this.actionService = useService("action");
        this.notificationService = useService("notification");
    },
    async navigateToOrbexMenu(newWindow) {
        const menu = this.env.model.getters.getChartOrbexMenu(this.props.chartId);
        await navigateToOrbexMenu(menu, this.actionService, this.notificationService, newWindow);
    },
    get hasOrbexMenu() {
        return this.env.model.getters.getChartOrbexMenu(this.props.chartId) !== undefined;
    },
    async onClick() {
        if (this.env.isDashboard() && this.hasOrbexMenu) {
            await this.navigateToOrbexMenu();
        }
    },
});

patch(spreadsheet.components.GaugeChartComponent.prototype, {
    setup() {
        super.setup();
        this.actionService = useService("action");
        this.notificationService = useService("notification");
    },
    async navigateToOrbexMenu(newWindow) {
        const menu = this.env.model.getters.getChartOrbexMenu(this.props.chartId);
        await navigateToOrbexMenu(menu, this.actionService, this.notificationService, newWindow);
    },
    get hasOrbexMenu() {
        return this.env.model.getters.getChartOrbexMenu(this.props.chartId) !== undefined;
    },
    async onClick() {
        if (this.env.isDashboard() && this.hasOrbexMenu) {
            await this.navigateToOrbexMenu();
        }
    },
});
