'use strict';
var Cesium = require('cesium');
var path = require('path');
var Promise = require('bluebird');
var getContentUri = require('./getContentUri');
var getDefaultLogger = require('./getDefaultLogger');
var getDefaultWriter = require('./getDefaultWriter');
var getJsonBufferPadded = require('./getJsonBufferPadded');
var getFilesCategorized = require('./getFilesCategorized');
var getFilesInDirectory = require('./getFilesInDirectory');
var isJson = require('./isJson');
var readFile = require('./readFile');

var Check = Cesium.Check;
var defaultValue = Cesium.defaultValue;
var defined = Cesium.defined;

module.exports = combineTileset;

/**
 * Combines all external tilesets into a single tileset.json file.
 *
 * @param {Object} options An object with the following properties:
 * @param {String} options.inputDirectory Path to the input directory.
 * @param {Object} [options.outputDirectory] Path to the output directory.
 * @param {Boolean} [options.tilesetJsonOnly=false] Only save the combined tileset.json file.
 * @param {Writer} [options.writer] A callback function that writes files after they have been processed.
 * @param {Logger} [options.logger] A callback function that logs messages. Defaults to console.log.
 *
 * @returns {Promise} A promise that resolves with the operation completes.
 */
function combineTileset(options) {
    options = defaultValue(options, defaultValue.EMPTY_OBJECT);
    Check.typeOf.string('options.inputDirectory', options.inputDirectory);

    var inputDirectory = options.inputDirectory;
    var outputDirectory = defaultValue(options.outputDirectory, path.join(path.dirname(inputDirectory), path.basename(inputDirectory) + '-combined'));
    var tilesetJsonOnly = defaultValue(options.tilesetJsonOnly, true);
    var writer = defaultValue(options.writer, getDefaultWriter(outputDirectory));
    var logger = defaultValue(options.logger, getDefaultLogger());

    return getFilesCategorized(inputDirectory)
        .then(function(files) {
            var rootTileset = files.tileset.root;
            var externalTilesets = files.tileset.external;
            logger('Combining ' + externalTilesets.length + ' external tilesets.');

            return combine(inputDirectory, rootTileset, undefined)
                .then(function(json) {
                    var relativePath = path.relative(inputDirectory, rootTileset);
                    var writePromise = writer(relativePath, getJsonBufferPadded(json));
                    var promises = [writePromise];
                    if (!tilesetJsonOnly) {
                        var filesNotToCopy = externalTilesets.concat(rootTileset);
                        promises.push(copyFiles(inputDirectory, filesNotToCopy, writer));
                    }
                    return Promise.all(promises);
                });
        });
}

function combine(inputDirectory, tileset, parentTile) {
    return readFile(tileset, 'json')
        .then(function(json) {
            var tilesetDirectory = path.dirname(tileset);
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
                    var contentUri = getContentUri(tile);
                    if (defined(contentUri)) {
                        if (isJson(contentUri)) {
                            // Load the external tileset
                            var externalTileset = path.join(tilesetDirectory, contentUri);
                            var promise = combine(inputDirectory, externalTileset, tile);
                            promises.push(promise);
                        } else {
                            contentUri = path.join(tilesetDirectory, contentUri);
                            tile.content.uri = getRelativePath(inputDirectory, contentUri);
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
                .then(function() {
                    return json;
                });
        });
}

function getRelativePath(inputDirectory, file) {
    var relative = path.relative(inputDirectory, file);
    return relative.replace(/\\/g, '/'); // Use forward slashes in the JSON
}

function copyFiles(inputDirectory, filesNotToCopy, writer) {
    return getFilesInDirectory(inputDirectory)
        .then(function(files) {
            files = files.filter(function(file) {
                return filesNotToCopy.indexOf(file) === -1;
            });
            return files;
        })
        .then(function(files) {
            return Promise.map(files, function(file) {
                return readFile(file)
                    .then(function(contents) {
                        var relativePath = path.relative(inputDirectory, file);
                        return writer(relativePath, contents);
                    });
            }, {concurrency: 100});
        });
}
