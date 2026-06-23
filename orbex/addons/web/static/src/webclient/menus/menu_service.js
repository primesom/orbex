import { session } from "@web/session";
import { browser } from "../../core/browser/browser";
import { router } from "../../core/browser/router";
import { registry } from "../../core/registry";

const loadMenusUrl = `/web/webclient/load_menus`;

function cleanMenuSlug(menu) {
    return (menu.actionPath || (menu.actionID ? `action-${menu.actionID}` : menu.name) || "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_-]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

export const menuService = {
    dependencies: ["action"],
    async start(env) {
        let currentAppId;
        let menusData;

        const fetchMenus = async (reload) => {
            if (!reload && orbex.loadMenusPromise) {
                return orbex.loadMenusPromise;
            }
            const res = await browser.fetch(loadMenusUrl, { cache: "no-store" });
            if (!res.ok) {
                throw new Error("Error while fetching menus");
            }
            return res.json();
        };
        const storedMenus = browser.localStorage.getItem("webclient_menus");
        const storedMenusVersion = browser.localStorage.getItem("webclient_menus_version");

        if (storedMenus && storedMenusVersion === session.registry_hash) {
            fetchMenus().then((res) => {
                if (res) {
                    const fetchedMenus = JSON.stringify(res);
                    if (fetchedMenus !== storedMenus) {
                        try {
                            browser.localStorage.setItem("webclient_menus", fetchedMenus);
                        } catch (error) {
                            console.error("Error while storing menus in localStorage", error);
                        }
                        menusData = res;
                        env.bus.trigger("MENUS:APP-CHANGED");
                    }
                }
            });
            menusData = JSON.parse(storedMenus);
        } else {
            menusData = await fetchMenus();
            if (menusData) {
                try {
                    browser.localStorage.setItem("webclient_menus_version", session.registry_hash);
                    browser.localStorage.setItem("webclient_menus", JSON.stringify(menusData));
                } catch (error) {
                    console.error("Error while storing menus in localStorage", error);
                }
            }
        }

        function _getMenu(menuId) {
            return menusData[menuId];
        }
        function setCurrentMenu(menu) {
            menu = typeof menu === "number" ? _getMenu(menu) : menu;
            if (menu && menu.appID !== currentAppId) {
                currentAppId = menu.appID;
                browser.sessionStorage.setItem("menu_id", currentAppId);
                browser.sessionStorage.setItem("app_slug", cleanMenuSlug(menu));
                env.bus.trigger("MENUS:APP-CHANGED");
            } else if (menu) {
                browser.sessionStorage.setItem("app_slug", cleanMenuSlug(menu));
            }
        }

        return {
            getAll() {
                return Object.values(menusData);
            },
            getApps() {
                return this.getMenu("root").children.map((mid) => this.getMenu(mid));
            },
            getMenu: _getMenu,
            getCurrentApp() {
                if (!currentAppId) {
                    return;
                }
                return this.getMenu(currentAppId);
            },
            getMenuAsTree(menuID) {
                const menu = this.getMenu(menuID);
                if (!menu.childrenTree) {
                    menu.childrenTree = menu.children.map((mid) => this.getMenuAsTree(mid));
                }
                return menu;
            },
            async selectMenu(menu) {
                menu = typeof menu === "number" ? this.getMenu(menu) : menu;
                if (!menu.actionID) {
                    return;
                }
                const appSlug = cleanMenuSlug(menu);
                await env.services.action.doAction(menu.actionID, {
                    clearBreadcrumbs: true,
                    onActionReady: () => {
                        setCurrentMenu(menu);
                        router.replaceState({ appSlug }, { sync: true });
                    },
                });
            },
            setCurrentMenu,
            async reload() {
                if (fetchMenus) {
                    menusData = await fetchMenus(true);
                    env.bus.trigger("MENUS:APP-CHANGED");
                }
            },
        };
    },
};

registry.category("services").add("menu", menuService);
