import {type SpdxExpression, parseRawTokens} from './parse-tokens.js';
import {scanRawExpression} from './scan-expression.js';

/**
 * Parse the given source string as SPDX license syntax.
 *
 * @category Main
 * @throws SpdxParseError when parsing fails.
 */
export function parseSpdxExpression(source: string): SpdxExpression {
    return parseRawTokens(scanRawExpression(source));
}

/**
 * Checks if the given source string is valid SPDX license syntax.
 *
 * @category Main
 */
export function isValidSpdxExpression(source: string): boolean {
    try {
        parseSpdxExpression(source);
        return true;
    } catch {
        return false;
    }
}
