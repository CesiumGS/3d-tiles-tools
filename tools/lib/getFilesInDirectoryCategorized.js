'use strict';
var Cesium = require('cesium');
var path = require('path');
var Promise = require('bluebird');
var getFilesInDirectory = require('./getFilesInDirectory');
var getMagic = require('./getMagic');
var readFile = require('./readFile');

var defaultValue = Cesium.defaultValue;
var RuntimeError = Cesium.RuntimeError;

module.exports = getFilesInDirectoryCategorized;

/**
 * @private
 */
function getFilesInDirectoryCategorized(directory) {
    var filesCategorized = {
        rootTileset: undefined,
        externalTilesets: [],
        tilesets: [],
        b3dm: [],
        i3dm: [],
        pnts: [],
        cmpt: [],
        vctr: [],
        geom: [],
        other: []
    };

    return getFilesInDirectory(directory)
        .then(function(files) {
            return Promise.each([
                categorizeFiles(files, filesCategorized),
                categorizeTilesetFiles(filesCategorized)
            ]);
        })
        .then(function() {
            return filesCategorized;
        });
}

function categorizeTilesetFiles(filesCategorized) {
    var externalTilesets = [];
    var tilesets = filesCategorized.tilesets;

    return Promise.map(tilesets, function(tileset) {
        return readFile(tileset, 'json')
            .then(function(json) {
                externalTilesets = externalTilesets.concat(getExternalTilesets(tileset, json));
            });
    }).then(function() {
        var rootTilesets = tilesets.filter(function(tileset) {
            return externalTilesets.indexOf(tileset) === -1;
        });
        if (rootTilesets.length > 0) {
            throw new RuntimeError('More than one root tileset JSON file found in directory');
        }
        filesCategorized.rootTileset = rootTilesets[0];
        filesCategorized.externalTilesets = externalTilesets;
    });
}

function getExternalTilesets(tilesetFile, tilesetJson) {
    var externalTilesets = [];
    var tilesetDirectory = path.dirname(tilesetFile);
    var stack = [];
    stack.push(tilesetJson.root);
    while (stack.length > 0) {
        var tile = stack.pop();
        if (defined(tile.content)) {
            var externalTileset = defaultValue(tile.content.uri, tile.content.url); // 0.0 to 1.0 rename
            externalTileset = path.join(tilesetDirectory, externalTileset);
            externalTilesets.push(externalTileset);
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
    return externalTilesets;
}

function categorizeFiles(files, filesCategorized) {
    return Promise.map(files, function(file) {
        var extension = path.slice(1, path.extname(file));
        if (extension === 'json') {
            return readFile(file, 'json')
                .then(function(json) {
                    categorizeJson(file, json, filesCategorized);
                });
        } else if (defined(filesCategorized[extension])) {
            filesCategorized[extension].push(file);
        } else if (extension.length > 0) {
            filesCategorized.other.push(file);
        } else {
            // No extension - categorize based on its contents
            return readFile(file)
                .then(function(contents) {
                    var magic = getMagic(contents);
                    if (defined(filesCategorized[magic])) {
                        filesCategorized[magic].push(file);
                    } else {
                        try {
                            var json = JSON.parse(contents.toString());
                            categorizeJson(file, json, filesCategorized);
                        }
                        catch(error) {
                            // Not a json file
                            filesCategorized.other.push(file);
                        }
                    }
                });
        }
    });
}

function categorizeJson(jsonFile, json, filesCategorized) {
    if (defined(json.asset) && defined(json.asset.version) && defined(json.root)) {
        filesCategorized.tilesets.push(jsonFile);
    } else {
        filesCategorized.other.push(jsonFile);
    }
}
