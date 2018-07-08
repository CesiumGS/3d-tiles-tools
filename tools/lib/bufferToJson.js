'use strict';
module.exports = bufferToJson;

/**
 * Returns a JSON object from a buffer containing JSON.
 *
 * @param {Buffer} buffer The buffer.
 *
 * @returns {Object} The JSON object.
 *
 * @private
 */
function bufferToJson(buffer) {
    if (buffer.length === 0) {
        return {};
    }
    return JSON.parse(buffer.toString());
}
