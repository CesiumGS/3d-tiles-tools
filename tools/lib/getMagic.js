'use strict';
var Cesium = require('cesium');

var defaultValue = Cesium.defaultValue;

module.exports = getMagic;

/**
 * @private
 */
function getMagic(tileBuffer, byteOffset) {
    byteOffset = defaultValue(byteOffset, 0);
    return tileBuffer.toString('utf8', byteOffset, byteOffset + 4);
}
