'use strict';
module.exports = isGzipped;

/**
 * Determines whether the buffer is gzipped.
 *
 * @param {Buffer} buffer The buffer.
 *
 * @returns {Boolean} Whether the buffer is gzipped.
 *
 * @private
 */
function isGzipped(buffer) {
    return (buffer[0] === 0x1f) && (buffer[1] === 0x8b);
}
