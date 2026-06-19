/** @orbex-module **/

import { Component, useState } from "@orbex/owl";
import { browser } from "@web/core/browser/browser";
import { cookie } from "@web/core/browser/cookie";
import { _t } from "@web/core/l10n/translation";
import { registry } from "@web/core/registry";
import { user } from "@web/core/user";

export class ColorSchemeSystrayItem extends Component {
    static template = "web_orbex.ColorSchemeSystrayItem";
    static props = {};

    setup() {
        this.state = useState({
            scheme: user.settings.color_scheme || "system",
        });
    }

    get activeScheme() {
        return this.state.scheme === "dark" ? "dark" : "light";
    }

    get title() {
        return this.activeScheme === "dark" ? _t("Switch to light mode") : _t("Switch to dark mode");
    }

    async toggleColorScheme() {
        const scheme = this.activeScheme === "dark" ? "light" : "dark";
        this.state.scheme = scheme;
        await user.setUserSettings("color_scheme", scheme);
        user.updateUserSettings("color_scheme", scheme);
        cookie.set("color_scheme", scheme);
        browser.location.reload();
    }
}

export const colorSchemeSystrayItem = {
    Component: ColorSchemeSystrayItem,
    isDisplayed: () => !user.isPublic,
};

registry.category("systray").add("web_orbex.color_scheme", colorSchemeSystrayItem, {
    sequence: 90,
});
