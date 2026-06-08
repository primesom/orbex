// @ts-check

import { helpers } from "@orbex/o-spreadsheet";

const { getFunctionsFromTokens } = helpers;

/** @typedef {import("@orbex/o-spreadsheet").Token} Token */

/**
 * Parse a spreadsheet formula and detect the number of LIST functions that are
 * present in the given formula.
 *
 * @param {Token[]} tokens
 *
 * @returns {number}
 */
export function getNumberOfListFormulas(tokens) {
    return getFunctionsFromTokens(tokens, ["ORBEX.LIST", "ORBEX.LIST.HEADER"]).length;
}

/**
 * Get the first List function description of the given formula.
 *
 * @param {Token[]} tokens
 *
 * @returns {import("../helpers/orbex_functions_helpers").OrbexFunctionDescription|undefined}
 */
export function getFirstListFunction(tokens) {
    return getFunctionsFromTokens(tokens, ["ORBEX.LIST", "ORBEX.LIST.HEADER"])[0];
}
