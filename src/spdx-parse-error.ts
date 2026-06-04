/**
 * Error thrown when an SPDX license expression fails to parse.
 *
 * @category Internal
 */
export class SpdxParseError extends Error {
    public override readonly name = 'SpdxParseError';
}
