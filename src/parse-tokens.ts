import {type SpdxToken, SpdxTokenType} from './scan-expression.js';
import {SpdxParseError} from './spdx-parse-error.js';

/**
 * The logical conjunction joining two halves of an SPDX expression.
 *
 * @category Internal
 */
export enum SpdxConjunction {
    AND = 'AND',
    OR = 'OR',
}

/**
 * A single license node within a parsed SPDX expression.
 *
 * @category Internal
 */
export type SpdxLicenseInfo = {
    license: string;
    plus?: boolean;
    exception?: string;
};

/**
 * A binary node joining two SPDX expressions with a conjunction.
 *
 * @category Internal
 */
export type SpdxConjunctionInfo = {
    left: SpdxExpression;
    conjunction: SpdxConjunction;
    right: SpdxExpression;
};

/**
 * A parsed SPDX expression: either a single license or a conjunction of two expressions.
 *
 * @category Internal
 */
export type SpdxExpression = SpdxLicenseInfo | SpdxConjunctionInfo;

/**
 * Parses a flat list of {@link SpdxToken}s into an {@link SpdxExpression} tree.
 *
 * The ABNF grammar in the spec is totally ambiguous. This parser follows the operator precedence
 * defined in the `Order of Precedence and Parentheses` section.
 *
 * Ported from
 * https://github.com/jslicense/spdx-expression-parse.js/blob/bb753f168e3364649eee90fb5d04e418e2d64d7b/parse.js,
 * which has the following license:
 *
 *     The MIT License
 *
 *     Copyright (c) 2015 Kyle E. Mitchell & other authors listed in AUTHORS
 *
 *     Permission is hereby granted, free of charge, to any person obtaining
 *     a copy of this software and associated documentation files (the
 *     "Software"), to deal in the Software without restriction, including
 *     without limitation the rights to use, copy, modify, merge, publish,
 *     distribute, sublicense, and/or sell copies of the Software, and to
 *     permit persons to whom the Software is furnished to do so, subject to
 *     the following conditions:
 *
 *     The above copyright notice and this permission notice shall be included
 *     in all copies or substantial portions of the Software.
 *
 *     THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 *     EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 *     MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 *     IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
 *     CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
 *     TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
 *     SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 * @category Internal
 */
export function parseRawTokens(tokens: ReadonlyArray<SpdxToken>): SpdxExpression {
    let index = 0;

    function hasMore() {
        return index < tokens.length;
    }

    function token(): SpdxToken | undefined {
        return hasMore() ? tokens[index] : undefined;
    }

    function next() {
        /**
         * `next` is only ever called after a `token()` check has already confirmed that a token
         * exists, so `hasMore()` is always true at this point. This guard is kept as an invariant
         * safeguard but is unreachable in practice, hence the coverage exclusion.
         */
        /* c8 ignore next 3 */
        if (!hasMore()) {
            throw new SpdxParseError('Unexpected end of expression');
        }
        index++;
    }

    function parseOperator(operator: string): string | undefined {
        const currentToken = token();
        if (
            currentToken &&
            currentToken.type === SpdxTokenType.Operator &&
            operator === currentToken.string
        ) {
            next();
            return currentToken.string;
        }
        return undefined;
    }

    function parseWith(): string | undefined {
        if (parseOperator('WITH')) {
            const currentToken = token();
            if (currentToken && currentToken.type === SpdxTokenType.Exception) {
                next();
                return currentToken.string;
            }
            throw new SpdxParseError('Expected exception after `WITH`');
        }
        return undefined;
    }

    function parseLicenseRef(): SpdxLicenseInfo | undefined {
        /**
         * Everything is concatenated into one string for backward-compatibility but it could be
         * better to return a nice structure.
         */
        const begin = index;
        let string = '';
        const documentRefToken = token();
        if (documentRefToken && documentRefToken.type === SpdxTokenType.DocumentRef) {
            next();
            string += 'DocumentRef-' + documentRefToken.string + ':';
            if (!parseOperator(':')) {
                throw new SpdxParseError('Expected `:` after `DocumentRef-...`');
            }
        }
        const licenseRefToken = token();
        if (licenseRefToken && licenseRefToken.type === SpdxTokenType.LicenseRef) {
            next();
            string += 'LicenseRef-' + licenseRefToken.string;
            return {
                license: string,
            };
        }
        index = begin;
        return undefined;
    }

    function parseLicense(): SpdxLicenseInfo | undefined {
        const currentToken = token();
        if (currentToken && currentToken.type === SpdxTokenType.License) {
            next();
            const node: SpdxLicenseInfo = {
                license: currentToken.string,
            };
            if (parseOperator('+')) {
                node.plus = true;
            }
            const exception = parseWith();
            if (exception) {
                node.exception = exception;
            }
            return node;
        }
        return undefined;
    }

    function parseParenthesizedExpression(): SpdxExpression | undefined {
        const left = parseOperator('(');
        if (!left) {
            return undefined;
        }

        const expr = parseExpression();

        if (!parseOperator(')')) {
            throw new SpdxParseError('Expected `)`');
        }

        return expr;
    }

    function parseAtom(): SpdxExpression | undefined {
        return parseParenthesizedExpression() || parseLicenseRef() || parseLicense();
    }

    function makeBinaryOpParser(
        operator: string,
        conjunction: SpdxConjunction,
        nextParser: () => SpdxExpression | undefined,
    ): () => SpdxExpression | undefined {
        return function parseBinaryOp(): SpdxExpression | undefined {
            const left = nextParser();
            if (!left) {
                return undefined;
            } else if (!parseOperator(operator)) {
                return left;
            }

            const right = parseBinaryOp();
            if (!right) {
                throw new SpdxParseError('Expected expression');
            }
            return {
                left,
                conjunction,
                right,
            };
        };
    }

    const parseAnd = makeBinaryOpParser('AND', SpdxConjunction.AND, parseAtom);
    const parseExpression = makeBinaryOpParser('OR', SpdxConjunction.OR, parseAnd);

    const node = parseExpression();
    if (!node || hasMore()) {
        throw new SpdxParseError('Syntax error');
    }
    return node;
}
