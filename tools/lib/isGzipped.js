'use strict';
module.exports = isGzipped;

/**
 * @private
 */
function isGzipped(buffer) {
    return (buffer[0] === 0x1f) && (buffer[1] === 0x8b);
}
