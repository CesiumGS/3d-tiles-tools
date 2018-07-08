'use strict';
var Cesium = require('cesium');

var defaultValue = Cesium.defaultValue;

module.exports = getMagic;

/**
 * Returns the file identifier, or magic, from the first four bytes of the content's header.
 *
 * @param {Buffer} contents The file contents.
 * @param {Number} [byteOffset=0] The byte offset on which the contents start.
 *
 * @returns {String} The magic.
 *
 * @private
 */
function getMagic(contents, byteOffset) {
    byteOffset = defaultValue(byteOffset, 0);
    return contents.toString('utf8', byteOffset, byteOffset + 4);
}
