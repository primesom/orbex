// @ts-check

import { helpers } from "@orbex/o-spreadsheet";

const { getFunctionsFromTokens } = helpers;

/**
 * @typedef {import("@orbex/o-spreadsheet").Token} Token
 * @typedef  {import("@spreadsheet/helpers/orbex_functions_helpers").OrbexFunctionDescription} OrbexFunctionDescription
 */

/**
 * @param {Token[]} tokens
 * @returns {number}
 */
export function getNumberOfAccountFormulas(tokens) {
    return getFunctionsFromTokens(tokens, ["ORBEX.BALANCE", "ORBEX.CREDIT", "ORBEX.DEBIT", "ORBEX.RESIDUAL", "ORBEX.PARTNER.BALANCE", "ORBEX.BALANCE.TAG"]).length;
}

/**
 * Get the first Account function description of the given formula.
 *
 * @param {Token[]} tokens
 * @returns {OrbexFunctionDescription | undefined}
 */
export function getFirstAccountFunction(tokens) {
    return getFunctionsFromTokens(tokens, ["ORBEX.BALANCE", "ORBEX.CREDIT", "ORBEX.DEBIT", "ORBEX.RESIDUAL", "ORBEX.PARTNER.BALANCE", "ORBEX.BALANCE.TAG"])[0];
}
