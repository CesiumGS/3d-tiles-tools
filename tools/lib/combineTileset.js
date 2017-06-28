'use strict';
var Cesium = require('cesium');
var fsExtra = require('fs-extra');
var path = require('path');
var Promise = require('bluebird');
var zlib = require('zlib');
var getDefaultWriteCallback = require('./getDefaultWriteCallback');
var getJsonBufferPadded =require('./getJsonBufferPadded');
var isGzippedFile = require('./isGzippedFile');
var isJson = require('./isJson');
var readFile = require('./readFile');
var walkDirectory = require('./walkDirectory');

var Check = Cesium.Check;
var defaultValue = Cesium.defaultValue;
var defined = Cesium.defined;

module.exports = combineTileset;

/**
 * Combines all external tilesets into a single tileset.json file.
 *
 * @param {Object} options Object with the following properties:
 * @param {String} options.inputDirectory Path to the input directory.
 * @param {Object} [options.outputDirectory] Path to the output directory.
 * @param {String} [options.rootJson='tileset.json'] Relative path to the root json.
 * @param {WriteCallback} [options.writeCallback] A callback function that writes files after they have been processed.
 * @param {LogCallback} [options.logCallback] A callback function that logs messages.
 *
 * @returns {Promise} A promise that resolves with the operation completes.
 */
function combineTileset(options) {
    options = defaultValue(options, defaultValue.EMPTY_OBJECT);
    var inputDirectory = options.inputDirectory;
    var outputDirectory = options.outputDirectory;
    var rootJsonFile = defaultValue(options.rootJson, 'tileset.json');

    Check.typeOf.string('options.inputDirectory', inputDirectory);

    inputDirectory = path.normalize(inputDirectory);
    outputDirectory = path.normalize(defaultValue(outputDirectory,
        path.join(path.dirname(inputDirectory), path.basename(inputDirectory) + '-combined')));
    rootJsonFile = path.join(inputDirectory, rootJsonFile);

    var writeCallback = defaultValue(options.writeCallback, getDefaultWriteCallback(outputDirectory));
    var logCallback = options.logCallback;

    var tilesets = [rootJsonFile];
    return combine(rootJsonFile, inputDirectory, undefined, tilesets)
        .then(function (json) {
            if (defined(logCallback)) {
                logCallback('Combined ' + (tilesets.length - 1) + ' external tilesets.');
            }
            // If the root json is originally gzipped, save the output json as gzipped
            var writeRootJsonPromise = isGzippedFile(rootJsonFile)
                .then(function (gzipped) {
                    var data = getJsonBufferPadded(json, gzipped);
                    if (gzipped) {
                        data = zlib.gzipSync(data);
                    }
                    var relativePath = path.relative(inputDirectory, rootJsonFile);
                    return writeCallback(relativePath, data);
                });
            var copyFilesPromise = copyFiles(inputDirectory, tilesets, writeCallback);
            return Promise.all([writeRootJsonPromise, copyFilesPromise]);
        });
}

function combine(jsonFile, inputDirectory, parentTile, tilesets) {
    return readFile(jsonFile, 'json')
        .then(function (json) {
            var tilesetDirectory = path.dirname(jsonFile);
            var promises = [];
            var root = json.root;

            if (defined(root)) {
                // Append the external tileset to the parent tile
                if (defined(parentTile)) {
                    parentTile.content = root.content;
                    parentTile.children = root.children;
                }
                // Loop over all the tiles
                var stack = [];
                stack.push(root);
                while (stack.length > 0) {
                    var tile = stack.pop();
                    // Look for external tilesets
                    if (defined(tile.content)) {
                        var url = tile.content.url;
                        if (isJson(url)) {
                            // Load the external tileset
                            url = path.join(tilesetDirectory, url);
                            tilesets.push(url);
                            var promise = combine(url, inputDirectory, tile, tilesets);
                            promises.push(promise);
                        } else {
                            var contentUrl = path.join(tilesetDirectory, url);
                            tile.content.url = getRelativePath(inputDirectory, contentUrl);
                        }
                    }
                    // Push children to the stack
                    var children = tile.children;
                    if (defined(children)) {
                        var length = children.length;
                        for (var i = 0; i < length; ++i) {
                            stack.push(children[i]);
                        }
                    }
                }
            }
            // Waits for all the external tilesets to finish loading before the promise resolves
            return Promise.all(promises)
                .then(function () {
                    return json;
                });
        });
}

function getRelativePath(inputDirectory, file) {
    var relative = path.relative(inputDirectory, file);
    return relative.replace(/\\/g, '/'); // Use forward slashes in the JSON
}

function isTileset(inputDirectory, file, tilesets) {
    var relativePath = getRelativePath(inputDirectory, file);
    return tilesets.indexOf(relativePath) >= 0;
}

function copyFiles(inputDirectory, tilesets, writeCallback) {
    tilesets = tilesets.map(function(tileset) {
        return getRelativePath(inputDirectory, tileset);
    });
    // Copy all files except tilesets
    return walkDirectory(inputDirectory, function(file) {
        if (!isTileset(inputDirectory, file, tilesets)) {
            return fsExtra.readFile(file)
                .then(function (data) {
                    var relativePath = getRelativePath(inputDirectory, file);
                    return writeCallback(relativePath, data);
                });
        }
    });
}
