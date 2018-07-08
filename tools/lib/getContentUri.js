'use strict';
var Cesium = require('cesium');

var defined = Cesium.defined;

module.exports = getContentUri;

/**
 * Gets a tile's content uri. Works for tilesets that are version 0.0 or 1.0.
 *
 * @param {Object} tile The tile.
 *
 * @returns {String} The content uri, or undefined if the tile does not have content.
 *
 * @private
 */
function getContentUri(tile) {
    var content = tile.content;
    if (defined(content)) {
        if (defined(content.url)) {
            // Change content.url to content.uri
            content.uri = content.url;
            delete content.url;
        }
        return content.uri;
    }
}
