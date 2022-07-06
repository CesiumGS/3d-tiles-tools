'use strict';
const Cesium = require('cesium');
const fsExtra = require('fs-extra');
const path = require('path');
const Promise = require('bluebird');
const zlib = require('zlib');
const getDefaultWriteCallback = require('./getDefaultWriteCallback');
const getJsonBufferPadded =require('./getJsonBufferPadded');
const isGzippedFile = require('./isGzippedFile');
const isJson = require('./isJson');
const readFile = require('./readFile');
const walkDirectory = require('./walkDirectory');

const Check = Cesium.Check;
const defaultValue = Cesium.defaultValue;
const defined = Cesium.defined;

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
    let inputDirectory = options.inputDirectory;
    let outputDirectory = options.outputDirectory;
    let rootJsonFile = defaultValue(options.rootJson, 'tileset.json');

    Check.typeOf.string('options.inputDirectory', inputDirectory);

    inputDirectory = path.normalize(inputDirectory);
    outputDirectory = path.normalize(defaultValue(outputDirectory,
        path.join(path.dirname(inputDirectory), `${path.basename(inputDirectory)  }-combined`)));
    rootJsonFile = path.join(inputDirectory, rootJsonFile);

    const writeCallback = defaultValue(options.writeCallback, getDefaultWriteCallback(outputDirectory));
    const logCallback = options.logCallback;

    const tilesets = [rootJsonFile];
    return combine(rootJsonFile, inputDirectory, undefined, tilesets)
        .then(function (json) {
            if (defined(logCallback)) {
                logCallback(`Combined ${  tilesets.length - 1  } external tilesets.`);
            }
            // If the root json is originally gzipped, save the output json as gzipped
            const writeRootJsonPromise = isGzippedFile(rootJsonFile)
                .then(function (gzipped) {
                    let data = getJsonBufferPadded(json, gzipped);
                    if (gzipped) {
                        data = zlib.gzipSync(data);
                    }
                    const relativePath = path.relative(inputDirectory, rootJsonFile);
                    return writeCallback(relativePath, data);
                });
            const copyFilesPromise = copyFiles(inputDirectory, tilesets, writeCallback);
            return Promise.all([writeRootJsonPromise, copyFilesPromise]);
        });
}

function combine(jsonFile, inputDirectory, parentTile, tilesets) {
    return readFile(jsonFile, 'json')
        .then(function (json) {
            const tilesetDirectory = path.dirname(jsonFile);
            const promises = [];
            const root = json.root;

            if (defined(root)) {
                // Append the external tileset to the parent tile
                if (defined(parentTile)) {
                    parentTile.content = root.content;
                    parentTile.children = root.children;
                }
                // Loop over all the tiles
                const stack = [];
                stack.push(root);
                while (stack.length > 0) {
                    const tile = stack.pop();
                    // Look for external tilesets
                    if (defined(tile.content)) {
                        let uri = tile.content.uri;
                        if (isJson(uri)) {
                            // Load the external tileset
                            uri = path.join(tilesetDirectory, uri);
                            tilesets.push(uri);
                            const promise = combine(uri, inputDirectory, tile, tilesets);
                            promises.push(promise);
                        } else {
                            const contentUri = path.join(tilesetDirectory, uri);
                            tile.content.uri = getRelativePath(inputDirectory, contentUri);
                        }
                    }
                    // Push children to the stack
                    const children = tile.children;
                    if (defined(children)) {
                        const length = children.length;
                        for (let i = 0; i < length; ++i) {
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
    const relative = path.relative(inputDirectory, file);
    return relative.replace(/\\/g, '/'); // Use forward slashes in the JSON
}

function isTileset(inputDirectory, file, tilesets) {
    const relativePath = getRelativePath(inputDirectory, file);
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
                    const relativePath = getRelativePath(inputDirectory, file);
                    return writeCallback(relativePath, data);
                });
        }
    });
}
