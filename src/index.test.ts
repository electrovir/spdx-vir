import {describe, it} from '@augment-vir/test';

describe('index.ts', () => {
    it('is importable', async () => {
        await import('./index.js');
    });
});
