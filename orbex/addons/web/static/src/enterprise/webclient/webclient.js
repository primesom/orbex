/** @orbex-module **/

import { WebClient } from "@web/webclient/webclient";
import { useBus, useService } from "@web/core/utils/hooks";
import { useState } from "@orbex/owl";
import { EnterpriseNavBar } from "./navbar/navbar";
import { AppSidebar } from "./app_sidebar/app_sidebar";

export class WebClientEnterprise extends WebClient {
    static template = "web_enterprise.WebClient";
    static components = {
        ...WebClient.components,
        NavBar: EnterpriseNavBar,
        AppSidebar,
    };
    setup() {
        super.setup();
        this.hm = useService("home_menu");
        this.menuService = useService("menu");
        this.appSidebar = useState({
            collapsed: localStorage.getItem("orbex_app_sidebar_collapsed") === "1",
        });
        useBus(this.env.bus, "ORBEX-APP-SIDEBAR:TOGGLE", () => this.toggleAppSidebar());
    }
    _loadDefaultApp() {
        return this.hm.toggle(true);
    }
    get apps() {
        return this.menuService.getApps();
    }
    get currentApp() {
        return this.menuService.getCurrentApp();
    }
    toggleAppSidebar() {
        this.appSidebar.collapsed = !this.appSidebar.collapsed;
        localStorage.setItem("orbex_app_sidebar_collapsed", this.appSidebar.collapsed ? "1" : "0");
    }
    selectSidebarApp(app) {
        return this.menuService.selectMenu(app);
    }
}
