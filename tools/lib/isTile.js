'use strict';
var fsExtra = require('fs-extra');
var path = require('path');
var getMagic = require('./getMagic');

module.exports = isTile;

/**
 * @private
 */
function isTile(file) {
    var extension = path.extname(file);
    if (extension === '.b3dm' ||
        extension === '.i3dm' ||
        extension === '.pnts' ||
        extension === '.cmpt' ||
        extension === '.vctr' ||
        extension === '.geom') {
        return true;
    }
    var magic = getMagic()
}

function isGzippedFile(file) {
    return new Promise(function (resolve, reject) {
        var readStream = fsExtra.createReadStream(file, readStreamOptions);
        readStream.on('error', reject);
        readStream.on('data', function(chunk) {
            resolve(isGzipped(chunk));
            readStream.destroy();
        });
    });
}
