import { CorePlugin, CoreViewPlugin, UIPlugin } from "@orbex/o-spreadsheet";

/**
 * An o-spreadsheet core plugin with access to all custom Orbex plugins
 * @type {import("@spreadsheet").OrbexCorePluginConstructor}
 **/
export const OrbexCorePlugin = CorePlugin;

/**
 * An o-spreadsheet CoreView plugin with access to all custom Orbex plugins
 * @type {import("@spreadsheet").OrbexUIPluginConstructor}
 **/
export const OrbexCoreViewPlugin = CoreViewPlugin;

/**
 * An o-spreadsheet UI plugin with access to all custom Orbex plugins
 * @type {import("@spreadsheet").OrbexUIPluginConstructor}
 **/
export const OrbexUIPlugin = UIPlugin;
