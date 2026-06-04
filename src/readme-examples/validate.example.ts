import {isValidSpdxExpression} from '../index.js';

// returns true
isValidSpdxExpression('(MIT OR CC0-1.0)');

// returns false
isValidSpdxExpression('(MIT or CC0 1.0)');
