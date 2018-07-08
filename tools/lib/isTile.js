'use strict';
var path = require('path');

module.exports = isTile;

/**
 * Determines whether a file is a 3D Tile based on its extension.
 *
 * @param {String} file The file.
 *
 * @returns {Boolean} Whether the file is a 3D Tile.
 *
 * @private
 */
function isTile(file) {
    var extension = path.extname(file).toLowerCase();
    if (extension === '.b3dm' ||
        extension === '.i3dm' ||
        extension === '.pnts' ||
        extension === '.cmpt' ||
        extension === '.vctr' ||
        extension === '.geom') {
        return true;
    }
}
