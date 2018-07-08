'use strict';
var Cesium = require('cesium');
var path = require('path');
var Promise = require('bluebird');
var getContentUri = require('./getContentUri');
var getFilesInDirectory = require('./getFilesInDirectory');
var isJson = require('./isJson');
var readFile = require('./readFile');

var defined = Cesium.defined;
var RuntimeError = Cesium.RuntimeError;

module.exports = getFilesCategorized;

/**
 * Returns the files in a directory, recursively, organized by type.
 *
 * @param {String} directory The directory.
 *
 * @returns {Promise} A promise that resolves to a categorized list of files.
 *
 * @private
 */
function getFilesCategorized(directory) {
    var filesCategorized = {
        tileset: {
            root: undefined,
            external: [],
            tree: undefined
        },
        tiles: {
            b3dm: [],
            i3dm: [],
            pnts: [],
            vctr: [],
            geom: [],
            cmpt: []
        },
        other: {
            gltf: [],
            glb: [],
            other: []
        }
    };

    return getFilesInDirectory(directory)
        .then(function(files) {
            return categorizeFiles(files, filesCategorized);
        })
        .then(function() {
            return categorizeTilesetFiles(filesCategorized);
        })
        .then(function() {
            return filesCategorized;
        });
}

function categorizeTilesetFiles(filesCategorized) {
    var tilesets = filesCategorized.tileset.external;
    var externalTilesetsByFile = {};
    var externalTilesets = [];

    return Promise.map(tilesets, function(tileset) {
        return readFile(tileset, 'json')
            .then(function(json) {
                externalTilesetsByFile[tileset] = getExternalTilesets(tileset, json);
                externalTilesets = externalTilesets.concat(externalTilesetsByFile[tileset]);
            });
    }).then(function() {
        var rootTilesets = tilesets.filter(function(tileset) {
            return externalTilesets.indexOf(tileset) === -1;
        });
        if (rootTilesets.length > 1) {
            throw new RuntimeError('More than one root tileset found in directory');
        }
        if (rootTilesets.length === 0) {
            throw new RuntimeError('No tileset found in directory');
        }
        var rootTileset = rootTilesets[0];
        var tree = {};
        tree[rootTileset] = {};
        getExternalTilesetTree(rootTileset, tree[rootTileset], externalTilesetsByFile);

        filesCategorized.tileset.root = rootTileset;
        filesCategorized.tileset.external = externalTilesets;
        filesCategorized.tileset.tree = tree;
    });
}

function getExternalTilesetTree(tileset, tree, externalTilesetsByFile) {
    var externalTilesets = externalTilesetsByFile[tileset];
    var length = externalTilesets.length;
    for (var i = 0; i < length; ++i) {
        var externalTileset = externalTilesets[i];
        tree[externalTileset] = {};
        getExternalTilesetTree(externalTileset, tree[externalTileset], externalTilesetsByFile);
    }
}

function getExternalTilesets(tileset, json) {
    var externalTilesets = [];
    var tilesetDirectory = path.dirname(tileset);
    var stack = [];
    stack.push(json.root);
    while (stack.length > 0) {
        var tile = stack.pop();
        var contentUri = getContentUri(tile);
        if (defined(contentUri) && isJson(contentUri)) {
            var externalTileset = path.join(tilesetDirectory, contentUri);
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
        var extension = path.extname(file).toLowerCase();
        switch (extension) {
            case '.json':
                return categorizeJson(file, filesCategorized);
            case '.b3dm':
                return filesCategorized.tiles.b3dm.push(file);
            case '.i3dm':
                return filesCategorized.tiles.i3dm.push(file);
            case '.pnts':
                return filesCategorized.tiles.pnts.push(file);
            case '.vctr':
                return filesCategorized.tiles.vctr.push(file);
            case '.geom':
                return filesCategorized.tiles.geom.push(file);
            case '.cmpt':
                return filesCategorized.tiles.cmpt.push(file);
            case '.gltf':
                return filesCategorized.other.gltf.push(file);
            case '.glb':
                return filesCategorized.other.glb.push(file);
            default:
                return filesCategorized.other.other.push(file);
        }
    });
}

function categorizeJson(file, filesCategorized) {
    return readFile(file, 'json')
        .then(function(json) {
            if (defined(json.asset) && defined(json.asset.version) && defined(json.root)) {
                filesCategorized.tileset.external.push(file);
            } else {
                filesCategorized.other.other.push(file);
            }
        });
}
