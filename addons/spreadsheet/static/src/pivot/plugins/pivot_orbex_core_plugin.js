// @ts-check

import { Domain } from "@web/core/domain";
import { OrbexCorePlugin } from "@spreadsheet/plugins";

export class PivotOrbexCorePlugin extends OrbexCorePlugin {
    handle(cmd) {
        switch (cmd.type) {
            // this command is deprecated. use UPDATE_PIVOT instead
            case "UPDATE_ORBEX_PIVOT_DOMAIN":
                this.dispatch("UPDATE_PIVOT", {
                    pivotId: cmd.pivotId,
                    pivot: {
                        ...this.getters.getPivotCoreDefinition(cmd.pivotId),
                        domain: cmd.domain,
                    },
                });
                break;
        }
    }

    /**
     * Transform the domain of a pivot definition to a more readable format
     *
     * @param {Object} data
     */
    export(data) {
        if (data.pivots) {
            for (const id in data.pivots) {
                if (data.pivots[id].type === "ORBEX") {
                    data.pivots[id].domain = new Domain(data.pivots[id].domain).toJson();
                }
            }
        }
    }
}
