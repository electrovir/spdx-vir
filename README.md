# spdx-vir

Parses and validates license strings strictly according to the SPDX grammar: https://spdx.github.io/spdx-spec/v2.3/SPDX-license-expressions.

License ids have been extracted from https://spdx.org/licenses/licenses.json and exceptions from https://spdx.org/licenses/exceptions.json.

Based on https://www.npmjs.com/package/spdx-expression-parse but more strict to the grammar and written in modern ESM syntax.

Test it out here: https://codepen.io/electrovir/pen/yyVjVQR

## Install

```sh
npm i spdx-vir
```

## Usage

Validating expressions:

<!-- example-link: src/readme-examples/validate.example.ts -->

```TypeScript
import {isValidSpdxExpression} from 'spdx-vir';

// returns true
isValidSpdxExpression('(MIT OR CC0-1.0)');

// returns false
isValidSpdxExpression('(MIT or CC0 1.0)');
```

Parsing expressions:

<!-- example-link: src/readme-examples/parse.example.ts -->

```TypeScript
import {parseSpdxExpression, SpdxConjunction} from 'spdx-vir';

parseSpdxExpression('(MIT OR CC0-1.0)');
// outputs the following:
const output = {
    conjunction: SpdxConjunction.OR,
    left: {
        license: 'MIT',
    },
    right: {
        license: 'CC0-1.0',
    },
};

// throws a SpdxParseError
parseSpdxExpression('(MIT or CC0 1.0)');
```
