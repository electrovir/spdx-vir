// cspell:words DOCUMENTREF, LICENSEREF

import {spdxExceptions} from './spdx-exceptions.js';
import {spdxLicenseIds} from './spdx-license-ids.js';
import {SpdxParseError} from './spdx-parse-error.js';

/**
 * The kind of token produced by {@link scanRawExpression} when reading an SPDX expression.
 *
 * @category Internal
 */
export enum SpdxTokenType {
    Operator = 'OPERATOR',
    DocumentRef = 'DOCUMENTREF',
    LicenseRef = 'LICENSEREF',
    License = 'LICENSE',
    Exception = 'EXCEPTION',
}

/**
 * A single lexical token scanned from an SPDX expression.
 *
 * @category Internal
 */
export type SpdxToken = {
    type: SpdxTokenType;
    string: string;
};

/**
 * Scans an SPDX expression string into a flat list of {@link SpdxToken}s.
 *
 * Ported from
 * https://github.com/jslicense/spdx-expression-parse.js/blob/bb753f168e3364649eee90fb5d04e418e2d64d7b/scan.js,
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
export function scanRawExpression(source: string): SpdxToken[] {
    let index = 0;

    function hasMore() {
        return index < source.length;
    }

    /**
     * `value` can be a regexp or a string. If it is recognized, the matching source string is
     * returned and the index is incremented. Otherwise `undefined` is returned.
     */
    function read(value: RegExp | string): string | undefined {
        if (value instanceof RegExp) {
            const chars = source.slice(index);
            const match = chars.match(value);
            if (match) {
                index += match[0].length;
                return match[0];
            }
        } else if (source.indexOf(value, index) === index) {
            index += value.length;
            return value;
        }

        return undefined;
    }

    function skipWhitespace() {
        read(/ */);
    }

    function operator(): SpdxToken | undefined {
        /**
         * Per the SPDX license expression spec, the `AND`, `OR`, and `WITH` operators are
         * case-sensitive and must be uppercase. These patterns therefore intentionally omit the `i`
         * flag, diverging from the upstream implementation, which matches them case-insensitively.
         */
        const possibilities: ReadonlyArray<RegExp | string> = [
            /^WITH/,
            /^AND/,
            /^OR/,
            '(',
            ')',
            ':',
            '+',
        ];

        const string = possibilities.reduce<string | undefined>((found, possibility) => {
            return found || read(possibility);
        }, undefined);

        if (string === '+' && index > 1 && source[index - 2] === ' ') {
            throw new SpdxParseError('Space before `+`');
        } else if (!string) {
            return undefined;
        }

        return {
            type: SpdxTokenType.Operator,
            string,
        };
    }

    function idString(): string | undefined {
        return read(/[A-Za-z0-9-.]+/);
    }

    function expectIdString(): string {
        const string = idString();
        if (!string) {
            throw new SpdxParseError(`Expected id string at offset ${index}`);
        }
        return string;
    }

    function documentRef(): SpdxToken | undefined {
        if (read('DocumentRef-')) {
            return {
                type: SpdxTokenType.DocumentRef,
                string: expectIdString(),
            };
        }
        return undefined;
    }

    function licenseRef(): SpdxToken | undefined {
        if (read('LicenseRef-')) {
            return {
                type: SpdxTokenType.LicenseRef,
                string: expectIdString(),
            };
        }
        return undefined;
    }

    function identifier(): SpdxToken | undefined {
        const begin = index;
        const string = idString();

        if (string != undefined && spdxLicenseIds.includes(string)) {
            return {
                type: SpdxTokenType.License,
                string,
            };
        } else if (string != undefined && spdxExceptions.includes(string)) {
            return {
                type: SpdxTokenType.Exception,
                string,
            };
        }

        index = begin;
        return undefined;
    }

    /** Tries to read the next token. Returns `undefined` if no token is recognized. */
    function parseToken(): SpdxToken | undefined {
        // Ordering matters.
        return operator() || documentRef() || licenseRef() || identifier();
    }

    const tokens: SpdxToken[] = [];
    while (hasMore()) {
        skipWhitespace();
        if (!hasMore()) {
            break;
        }

        const token = parseToken();
        if (!token) {
            throw new SpdxParseError(`Unexpected '${source[index]}' at offset '${index}'`);
        }

        tokens.push(token);
    }
    return tokens;
}
