import {parseSpdxExpression, SpdxConjunction} from '../index.js';

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
