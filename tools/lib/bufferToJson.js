'use strict';
module.exports = bufferToJson;

/**
 * @private
 */
function bufferToJson(buffer) {
    if (buffer.length === 0) {
        return {};
    } else {
        return JSON.parse(buffer.toString());
    }
}
