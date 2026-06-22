/** @orbex-module **/

import { Component } from "@orbex/owl";

export class AppSidebar extends Component {
    static template = "web_orbex.AppSidebar";
    static props = {
        apps: { type: Array },
        currentApp: { type: Object, optional: true },
        collapsed: { type: Boolean },
        onToggle: { type: Function },
        onSelect: { type: Function },
    };

    isActive(app) {
        const currentApp = this.props.currentApp;
        return Boolean(
            currentApp &&
                (String(currentApp.id) === String(app.id) ||
                    (currentApp.xmlid && currentApp.xmlid === app.xmlid) ||
                    (currentApp.actionPath && currentApp.actionPath === app.actionPath))
        );
    }
}
