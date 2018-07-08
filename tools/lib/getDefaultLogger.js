'use strict';
module.exports = getDefaultLogger;

/**
 * Gets a callback function that logs messages.
 *
 * @returns {Function} A callback function that logs messages.
 *
 * @private
 */
function getDefaultLogger() {
    return function(message) {
        console.log(message);
    };
}
