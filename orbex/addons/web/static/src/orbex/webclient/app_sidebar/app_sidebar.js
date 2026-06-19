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
        return this.props.currentApp && this.props.currentApp.id === app.id;
    }
}
