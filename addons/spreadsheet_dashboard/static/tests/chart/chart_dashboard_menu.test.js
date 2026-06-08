import { describe, expect, test } from "@orbex/hoot";
import { Model } from "@orbex/o-spreadsheet";
import { insertChartInSpreadsheet } from "@spreadsheet/../tests/helpers/chart";
import { makeSpreadsheetMockEnv } from "@spreadsheet/../tests/helpers/model";
import { OrbexDataProvider } from "@spreadsheet/data_sources/orbex_data_provider";
import { createDashboardActionWithData } from "@spreadsheet_dashboard/../tests/helpers/dashboard_action";
import { defineSpreadsheetDashboardModels } from "@spreadsheet_dashboard/../tests/helpers/data";
import { contains } from "@web/../tests/web_test_helpers";

describe.current.tags("desktop");
defineSpreadsheetDashboardModels();

test("can change granularity", async () => {
    const env = await makeSpreadsheetMockEnv();
    const setupModel = new Model({}, { custom: { orbexDataProvider: new OrbexDataProvider(env) } });
    const chartId = insertChartInSpreadsheet(setupModel, "orbex_line", {
        metaData: {
            groupBy: ["date:month"],
            resModel: "partner",
            measure: "__count",
            order: null,
        },
    });
    const { model } = await createDashboardActionWithData(setupModel.exportData());

    expect("select.o-chart-dashboard-item").toHaveValue("month");
    await contains("select.o-chart-dashboard-item", { visible: false }).select("quarter");
    expect(model.getters.getChartGranularity(chartId)).toEqual({
        fieldName: "date",
        granularity: "quarter",
    });
    expect(model.getters.getChartDefinition(chartId).metaData.groupBy).toEqual(["date:quarter"]);
});
