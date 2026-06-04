import {assert} from '@augment-vir/assert';
import {describe, it} from '@augment-vir/test';
import {SpdxParseError} from './spdx-parse-error.js';

describe(SpdxParseError.name, () => {
    it('has a name matching the class constructor name', () => {
        const error = new SpdxParseError('something went wrong');

        assert.strictEquals(SpdxParseError.name, error.name);
    });
});
