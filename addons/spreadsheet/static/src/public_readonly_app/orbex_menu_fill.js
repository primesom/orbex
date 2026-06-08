/** @orbex-module **/

import { registries } from "@orbex/o-spreadsheet";

const { clickableCellRegistry } = registries;

const currentlinkCell = clickableCellRegistry.get("link");
currentlinkCell.condition = (position, getters) => {
    const evaluatedCell =getters.getEvaluatedCell(position);
    return evaluatedCell.link && evaluatedCell.link.isExternal;
};
