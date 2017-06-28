'use strict';
var Cesium = require('cesium');
var klaw = require('klaw');
var Promise = require('bluebird');

var defined = Cesium.defined;

module.exports = walkDirectory;

/**
 * @private
 */
function walkDirectory(directory, processFileCallback) {
    return new Promise(function(resolve, reject) {
        getNumberOfFilesInDirectory(directory)
            .then(function(numberOfFiles) {
                var numberComplete = 0;
                function complete() {
                    ++numberComplete;
                    if (numberComplete === numberOfFiles) {
                        resolve();
                    }
                }
                walk(directory, processFileCallback, complete, reject);
            })
            .catch(reject);
    });
}

function getNumberOfFilesInDirectory(directory) {
    return new Promise(function(resolve, reject) {
        var numberOfFiles = 0;
        klaw(directory)
            .on('data', function (item) {
                if (!item.stats.isDirectory()) {
                    ++numberOfFiles;
                }
            })
            .on('end', function () {
                resolve(numberOfFiles);
            })
            .on('error', reject);
    });
}

function walk(directory, processFileCallback, resolve, reject) {
    klaw(directory)
        .on('data', function (item) {
            if (!item.stats.isDirectory()) {
                var promise = processFileCallback(item.path);
                if (defined(promise) && defined(promise.then)) {
                    promise
                        .then(resolve)
                        .catch(reject);
                } else {
                    resolve();
                }
            }
        })
        .on('error', reject);
}
