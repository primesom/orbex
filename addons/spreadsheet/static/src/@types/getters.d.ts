import { CorePlugin, Model, UID } from "@orbex/o-spreadsheet";
import { ChartOrbexMenuPlugin, OrbexChartCorePlugin, OrbexChartCoreViewPlugin } from "@spreadsheet/chart";
import { CurrencyPlugin } from "@spreadsheet/currency/plugins/currency";
import { AccountingPlugin } from "addons/spreadsheet_account/static/src/plugins/accounting_plugin";
import { GlobalFiltersCorePlugin, GlobalFiltersCoreViewPlugin } from "@spreadsheet/global_filters";
import { ListCorePlugin, ListCoreViewPlugin } from "@spreadsheet/list";
import { IrMenuPlugin } from "@spreadsheet/ir_ui_menu/ir_ui_menu_plugin";
import { PivotOrbexCorePlugin } from "@spreadsheet/pivot";
import { PivotCoreGlobalFilterPlugin } from "@spreadsheet/pivot/plugins/pivot_core_global_filter_plugin";

type Getters = Model["getters"];
type CoreGetters = CorePlugin["getters"];

/**
 * Union of all getter names of a plugin.
 *
 * e.g. With the following plugin
 * @example
 * class MyPlugin {
 *   static getters = [
 *     "getCell",
 *     "getCellValue",
 *   ] as const;
 *   getCell() { ... }
 *   getCellValue() { ... }
 * }
 * type Names = GetterNames<typeof MyPlugin>
 * // is equivalent to "getCell" | "getCellValue"
 */
type GetterNames<Plugin extends { getters: readonly string[] }> = Plugin["getters"][number];

/**
 * Extract getter methods from a plugin, based on its `getters` static array.
 * @example
 * class MyPlugin {
 *   static getters = [
 *     "getCell",
 *     "getCellValue",
 *   ] as const;
 *   getCell() { ... }
 *   getCellValue() { ... }
 * }
 * type MyPluginGetters = PluginGetters<typeof MyPlugin>;
 * // MyPluginGetters is equivalent to:
 * // {
 * //   getCell: () => ...,
 * //   getCellValue: () => ...,
 * // }
 */
type PluginGetters<Plugin extends { new (...args: unknown[]): any; getters: readonly string[] }> =
    Pick<InstanceType<Plugin>, GetterNames<Plugin>>;

declare module "@spreadsheet" {
    /**
     * Add getters from custom plugins defined in orbex
     */

    interface OrbexCoreGetters extends CoreGetters {}
    interface OrbexCoreGetters extends PluginGetters<typeof GlobalFiltersCorePlugin> {}
    interface OrbexCoreGetters extends PluginGetters<typeof ListCorePlugin> {}
    interface OrbexCoreGetters extends PluginGetters<typeof OrbexChartCorePlugin> {}
    interface OrbexCoreGetters extends PluginGetters<typeof ChartOrbexMenuPlugin> {}
    interface OrbexCoreGetters extends PluginGetters<typeof IrMenuPlugin> {}
    interface OrbexCoreGetters extends PluginGetters<typeof PivotOrbexCorePlugin> {}
    interface OrbexCoreGetters extends PluginGetters<typeof PivotCoreGlobalFilterPlugin> {}

    interface OrbexGetters extends Getters {}
    interface OrbexGetters extends OrbexCoreGetters {}
    interface OrbexGetters extends PluginGetters<typeof GlobalFiltersCoreViewPlugin> {}
    interface OrbexGetters extends PluginGetters<typeof ListCoreViewPlugin> {}
    interface OrbexGetters extends PluginGetters<typeof OrbexChartCoreViewPlugin> {}
    interface OrbexGetters extends PluginGetters<typeof CurrencyPlugin> {}
    interface OrbexGetters extends PluginGetters<typeof AccountingPlugin> {}
}
