import { helpers } from "@orbex/o-spreadsheet";

const { toUnboundedZone } = helpers;

export function toRangeData(sheetId, xc) {
    return { _zone: toUnboundedZone(xc), _sheetId: sheetId };
}
