'use strict';
module.exports = isGzipped;

/**
 * Test if the provided data is gzipped.
 *
 * @param {Buffer} data A buffer containing the data to test.
 * @returns {Boolean} True if the data is gzipped, False if not.
 */
function isGzipped(data) {
    return data[0] === 0x1f && data[1] === 0x8b;
}
