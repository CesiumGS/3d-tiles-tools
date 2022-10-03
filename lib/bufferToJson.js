'use strict';
module.exports = bufferToJson;

/**
 * @private
 */
function bufferToJson(buffer) {
    if (buffer.length === 0) {
        return {};
    }
    return JSON.parse(buffer.toString());
}
