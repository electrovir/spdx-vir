// cspell:disable

import {describe, itCases} from '@augment-vir/test';
import {isValidSpdxExpression, parseSpdxExpression} from './api.js';
import {SpdxConjunction} from './parse-tokens.js';
import {SpdxParseError} from './spdx-parse-error.js';

describe(isValidSpdxExpression.name, () => {
    itCases(isValidSpdxExpression, [
        {
            it: 'accepts a valid expression',
            input: 'MIT AND Apache-2.0',
            expect: true,
        },
        {
            it: 'rejects an invalid expression',
            input: 'MIT and Apache-2.0',
            expect: false,
        },
    ]);

    itCases(isValidSpdxExpression, [
        {
            it: 'rejects my old license choice',
            input: '(MIT or CC0 1.0)',
            expect: false,
        },
        {
            it: 'accepts my new license choice',
            input: '(MIT OR CC0-1.0)',
            expect: true,
        },
        {
            it: 'accepts a bare license id',
            input: 'MIT',
            expect: true,
        },
        {
            it: 'accepts a license id with the `+` (or-later) operator',
            input: 'Apache-2.0+',
            expect: true,
        },
        {
            it: 'accepts another license id with the `+` operator',
            input: 'EPL-1.0+',
            expect: true,
        },
        {
            it: 'accepts a bare LicenseRef',
            input: 'LicenseRef-Custom-License-1',
            expect: true,
        },
        {
            it: 'accepts a DocumentRef-prefixed LicenseRef',
            input: 'DocumentRef-spdx-tool-1.2:LicenseRef-MIT-Style-2',
            expect: true,
        },
        {
            it: 'accepts a DocumentRef-prefixed LicenseRef with spaces around the colon',
            input: 'DocumentRef-spdx-tool-1.2 : LicenseRef-MIT-Style-2',
            expect: true,
        },
        {
            it: 'accepts a license with an exception',
            input: 'GPL-2.0-only WITH Classpath-exception-2.0',
            expect: true,
        },
        {
            it: 'accepts an or-later license with an exception',
            input: 'GPL-3.0-or-later WITH GCC-exception-3.1',
            expect: true,
        },
        {
            it: 'accepts a `+` license combined with an exception',
            input: 'GPL-2.0+ WITH GCC-exception-2.0',
            expect: true,
        },
        {
            it: 'accepts an AND expression',
            input: 'MIT AND ISC',
            expect: true,
        },
        {
            it: 'accepts an OR expression',
            input: 'MIT OR ISC',
            expect: true,
        },
        {
            it: 'accepts a chain of ANDs',
            input: 'MIT AND ISC AND BSD-3-Clause',
            expect: true,
        },
        {
            it: 'accepts a chain of ORs',
            input: 'MIT OR ISC OR BSD-3-Clause',
            expect: true,
        },
        {
            it: 'accepts mixed AND and OR',
            input: 'MIT AND ISC OR BSD-3-Clause',
            expect: true,
        },
        {
            it: 'accepts a LicenseRef within a compound expression',
            input: 'MIT OR LicenseRef-Custom-1',
            expect: true,
        },
        {
            it: 'accepts a parenthesized expression',
            input: '(MIT)',
            expect: true,
        },
        {
            it: 'accepts nested parentheses',
            input: '((MIT))',
            expect: true,
        },
        {
            it: 'accepts parentheses that group operators',
            input: '(MIT OR ISC) AND BSD-3-Clause',
            expect: true,
        },
        {
            it: 'accepts multiple parenthesized groups',
            input: '(MIT OR Apache-2.0) AND (BSD-3-Clause OR ISC)',
            expect: true,
        },
        {
            it: 'accepts deeply nested groups',
            input: 'MIT AND (ISC OR (BSD-2-Clause AND BSD-3-Clause))',
            expect: true,
        },
        {
            it: 'accepts a WITH expression as an AND operand',
            input: 'GPL-2.0-only WITH Classpath-exception-2.0 AND MIT',
            expect: true,
        },
        {
            it: 'accepts arbitrary surrounding and interior whitespace',
            input: '   MIT   AND   ISC   ',
            expect: true,
        },
        {
            it: 'rejects an empty string',
            input: '',
            expect: false,
        },
        {
            it: 'rejects whitespace only',
            input: '   ',
            expect: false,
        },
        {
            it: 'rejects an unknown license id',
            input: 'Not-A-Real-License-Id',
            expect: false,
        },
        {
            it: 'rejects an unknown exception id',
            input: 'MIT WITH Not-A-Real-Exception',
            expect: false,
        },
        {
            it: 'rejects a dangling AND',
            input: 'MIT AND',
            expect: false,
        },
        {
            it: 'rejects a dangling OR',
            input: 'MIT OR',
            expect: false,
        },
        {
            it: 'rejects a leading AND',
            input: 'AND MIT',
            expect: false,
        },
        {
            it: 'rejects a leading OR',
            input: 'OR MIT',
            expect: false,
        },
        {
            it: 'rejects a trailing operator',
            input: 'MIT AND ISC OR',
            expect: false,
        },
        {
            it: 'rejects WITH without an exception',
            input: 'MIT WITH',
            expect: false,
        },
        {
            it: 'rejects WITH without a license',
            input: 'WITH Classpath-exception-2.0',
            expect: false,
        },
        {
            it: 'rejects two adjacent operators',
            input: 'MIT AND AND ISC',
            expect: false,
        },
        {
            it: 'rejects two adjacent licenses with no operator',
            input: 'MIT ISC',
            expect: false,
        },
        {
            it: 'rejects an unbalanced opening parenthesis',
            input: '(MIT',
            expect: false,
        },
        {
            it: 'rejects an unbalanced closing parenthesis',
            input: 'MIT)',
            expect: false,
        },
        {
            it: 'rejects unbalanced nested parentheses',
            input: '((MIT)',
            expect: false,
        },
        {
            it: 'rejects empty parentheses',
            input: '()',
            expect: false,
        },
        {
            it: 'rejects a space before `+`',
            input: 'MIT +',
            expect: false,
        },
        {
            it: 'rejects a leading `+`',
            input: '+MIT',
            expect: false,
        },
        {
            it: 'rejects `+` applied to a LicenseRef',
            input: 'LicenseRef-foo+',
            expect: false,
        },
        {
            it: 'rejects WITH applied to a parenthesized expression',
            input: '(MIT OR ISC) WITH Classpath-exception-2.0',
            expect: false,
        },
        {
            it: 'rejects a DocumentRef without a LicenseRef',
            input: 'DocumentRef-foo',
            expect: false,
        },
        {
            it: 'rejects a DocumentRef with a colon but no LicenseRef',
            input: 'DocumentRef-foo:',
            expect: false,
        },
        {
            it: 'rejects a LicenseRef prefix with no idstring',
            input: 'LicenseRef-',
            expect: false,
        },
        {
            it: 'rejects a DocumentRef prefix with no idstring',
            input: 'DocumentRef-',
            expect: false,
        },
        {
            it: 'rejects a tab character',
            input: 'MIT\tAND\tISC',
            expect: false,
        },
        {
            it: 'rejects a newline character',
            input: 'MIT\nAND\nISC',
            expect: false,
        },
    ]);
});

describe(parseSpdxExpression.name, () => {
    itCases(parseSpdxExpression, [
        {
            it: 'parses my new license choice',
            input: '(MIT OR CC0-1.0)',
            expect: {
                conjunction: SpdxConjunction.OR,
                left: {
                    license: 'MIT',
                },
                right: {
                    license: 'CC0-1.0',
                },
            },
        },
        {
            it: 'rejects lower-case `and`',
            input: 'MIT and Apache-2.0',
            throws: {
                matchConstructor: SpdxParseError,
            },
        },
        {
            it: 'rejects lower-case `or`',
            input: 'MIT or Apache-2.0',
            throws: {
                matchConstructor: SpdxParseError,
            },
        },
        {
            it: 'rejects lower-case `with`',
            input: 'GPL-2.0 with GCC-exception-2.0',
            throws: {
                matchConstructor: SpdxParseError,
            },
        },
        {
            it: 'rejects mixed-case `aNd`',
            input: 'MIT aNd Apache-2.0',
            throws: {
                matchConstructor: SpdxParseError,
            },
        },
        {
            it: 'rejects mixed-case `Or`',
            input: 'MIT Or Apache-2.0',
            throws: {
                matchConstructor: SpdxParseError,
            },
        },
        {
            it: 'rejects mixed-case `WitH`',
            input: 'GPL-2.0 WitH GCC-exception-2.0',
            throws: {
                matchConstructor: SpdxParseError,
            },
        },
        {
            it: 'attaches `+` to its license id',
            input: 'Apache-2.0+',
            expect: {
                license: 'Apache-2.0',
                plus: true,
            },
        },
        {
            it: 'attaches an exception to its license',
            input: 'GPL-2.0-only WITH Classpath-exception-2.0',
            expect: {
                license: 'GPL-2.0-only',
                exception: 'Classpath-exception-2.0',
            },
        },
        {
            it: 'attaches both `+` and an exception to the same license',
            input: 'GPL-2.0+ WITH GCC-exception-2.0',
            expect: {
                license: 'GPL-2.0',
                plus: true,
                exception: 'GCC-exception-2.0',
            },
        },
        {
            it: 'groups AND tighter than a preceding OR',
            input: 'MIT OR ISC AND BSD-3-Clause',
            expect: {
                left: {
                    license: 'MIT',
                },
                conjunction: SpdxConjunction.OR,
                right: {
                    left: {
                        license: 'ISC',
                    },
                    conjunction: SpdxConjunction.AND,
                    right: {
                        license: 'BSD-3-Clause',
                    },
                },
            },
        },
        {
            it: 'groups AND tighter than a following OR',
            input: 'MIT AND ISC OR BSD-3-Clause',
            expect: {
                left: {
                    left: {
                        license: 'MIT',
                    },
                    conjunction: SpdxConjunction.AND,
                    right: {
                        license: 'ISC',
                    },
                },
                conjunction: SpdxConjunction.OR,
                right: {
                    license: 'BSD-3-Clause',
                },
            },
        },
        {
            it: 'groups WITH tighter than AND',
            input: 'GPL-2.0-only WITH Classpath-exception-2.0 AND MIT',
            expect: {
                left: {
                    license: 'GPL-2.0-only',
                    exception: 'Classpath-exception-2.0',
                },
                conjunction: SpdxConjunction.AND,
                right: {
                    license: 'MIT',
                },
            },
        },
        {
            it: 'groups WITH tighter than OR',
            input: 'MIT OR GPL-2.0-only WITH Classpath-exception-2.0',
            expect: {
                left: {
                    license: 'MIT',
                },
                conjunction: SpdxConjunction.OR,
                right: {
                    license: 'GPL-2.0-only',
                    exception: 'Classpath-exception-2.0',
                },
            },
        },
        {
            it: 'lets parentheses override precedence',
            input: '(MIT OR ISC) AND BSD-3-Clause',
            expect: {
                left: {
                    left: {
                        license: 'MIT',
                    },
                    conjunction: SpdxConjunction.OR,
                    right: {
                        license: 'ISC',
                    },
                },
                conjunction: SpdxConjunction.AND,
                right: {
                    license: 'BSD-3-Clause',
                },
            },
        },
        {
            it: 'unwraps redundant nested parentheses',
            input: '((MIT))',
            expect: {
                license: 'MIT',
            },
        },
    ]);

    /**
     * These tests were ported from
     * https://github.com/jslicense/spdx-expression-parse.js/blob/bb753f168e3364649eee90fb5d04e418e2d64d7b/test.js,
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
     */
    itCases(parseSpdxExpression, [
        {
            // The spec is unclear about tabs and newlines.
            it: 'forbids tabs',
            input: 'MIT\t',
            throws: {
                matchConstructor: SpdxParseError,
            },
        },
        {
            it: 'forbids newlines',
            input: '\nMIT',
            throws: {
                matchConstructor: SpdxParseError,
            },
        },
        {
            it: 'allows leading spaces',
            input: ' MIT',
            expect: {
                license: 'MIT',
            },
        },
        {
            it: 'allows trailing spaces',
            input: 'MIT ',
            expect: {
                license: 'MIT',
            },
        },
        {
            it: 'allows many spaces',
            input: 'MIT  AND    BSD-3-Clause',
            expect: {
                left: {
                    license: 'MIT',
                },
                conjunction: SpdxConjunction.AND,
                right: {
                    license: 'BSD-3-Clause',
                },
            },
        },
        {
            it: 'forbids spaces between a license-id and a following `+`',
            input: 'MIT +',
            throws: {
                matchMessage: 'Space before `+`',
            },
        },
        {
            it: 'parses a LicenseRef',
            input: 'LicenseRef-something',
            expect: {
                license: 'LicenseRef-something',
            },
        },
        {
            it: 'parses a DocumentRef and LicenseRef',
            input: 'DocumentRef-spdx-tool-1.2 : LicenseRef-MIT-Style-2',
            expect: {
                license: 'DocumentRef-spdx-tool-1.2:LicenseRef-MIT-Style-2',
            },
        },
        {
            // See the note in `parse.ts`.
            it: 'parses `AND` with the correct precedence',
            input: 'MIT AND BSD-3-Clause AND CC-BY-4.0',
            expect: {
                left: {
                    license: 'MIT',
                },
                conjunction: SpdxConjunction.AND,
                right: {
                    left: {
                        license: 'BSD-3-Clause',
                    },
                    conjunction: SpdxConjunction.AND,
                    right: {
                        license: 'CC-BY-4.0',
                    },
                },
            },
        },
        {
            it: 'parses `AND`, `OR` and `WITH` with the correct precedence',
            input: 'MIT AND BSD-3-Clause WITH GCC-exception-3.1 OR CC-BY-4.0 AND Apache-2.0',
            expect: {
                left: {
                    left: {
                        license: 'MIT',
                    },
                    conjunction: SpdxConjunction.AND,
                    right: {
                        license: 'BSD-3-Clause',
                        exception: 'GCC-exception-3.1',
                    },
                },
                conjunction: SpdxConjunction.OR,
                right: {
                    left: {
                        license: 'CC-BY-4.0',
                    },
                    conjunction: SpdxConjunction.AND,
                    right: {
                        license: 'Apache-2.0',
                    },
                },
            },
        },
    ]);
});
