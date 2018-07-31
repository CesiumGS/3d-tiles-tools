'use strict';
var Cesium = require('cesium');
var GltfPipeline = require('gltf-pipeline');
var path = require('path');
var Promise = require('bluebird');
var createB3dm = require('./createB3dm');
var createCmpt = require('./createCmpt');
var createI3dm = require('./createI3dm');
var createPnts = require('./createPnts');
var extractB3dm = require('./extractB3dm');
var extractCmpt = require('./extractCmpt');
var extractI3dm = require('./extractI3dm');
var extractPnts = require('./extractPnts');
var getDefaultLogger = require('./getDefaultLogger');
var getDefaultWriter = require('./getDefaultWriter');
var getFilesCategorized = require('./getFilesCategorized');
var getMagic = require('./getMagic');
var readFile = require('./readFile');

var arrayFill = Cesium.arrayFill;
var Axis = Cesium.Axis;
var Check = Cesium.Check;
var clone = Cesium.clone;
var defaultValue = Cesium.defaultValue;
var defined = Cesium.defined;
var Matrix4 = Cesium.Matrix4;

var glbToGltf = GltfPipeline.glbToGltf;
var gltfToGlb = GltfPipeline.gltfToGlb;
var processGlb = GltfPipeline.processGlb;
var processGltf = GltfPipeline.processGltf;
var removeExtension = GltfPipeline.removeExtension;

module.exports = upgradeTileset;

/**
 * Upgrades the tileset to the latest version of the 3D Tiles spec. Embedded glTF models will be upgraded to glTF 2.0.

 * @param {Object} options An object with the following properties:
 * @param {String} options.inputDirectory Path to the input directory.
 * @param {Object} [options.outputDirectory] Path to the output directory.
 * @param {Writer} [options.writer] A callback function that writes files after they have been processed.
 * @param {Logger} [options.logger] A callback function that logs messages. Defaults to console.log.
 *
 * @returns {Promise} A promise that resolves when the operation completes.
 */
function upgradeTileset(options) {
    options = clone(defaultValue(options, defaultValue.EMPTY_OBJECT), true);
    Check.typeOf.string('options.inputDirectory', options.inputDirectory);

    var inputDirectory = options.inputDirectory;
    var outputDirectory = defaultValue(options.outputDirectory, path.join(path.dirname(inputDirectory), path.basename(inputDirectory) + '-upgraded'));

    options.writer = defaultValue(options.writer, getDefaultWriter(outputDirectory));
    options.logger = defaultValue(options.logger, getDefaultLogger());

    options.logger('Upgrading to 3D Tiles version 1.0');

    return getFilesCategorized(inputDirectory)
        .then(function(files) {
            return getGltfUpAxis(files.tileset.root)
                .then(function(gltfUpAxis) {
                    options.gltfUpAxis = gltfUpAxis;
                    return upgradeFiles(files, options);
                });
        });
}

function getGltfUpAxis(tileset) {
    return readFile(tileset, 'json')
        .then(function(json) {
            return json.asset.gltfUpAxis;
        });
}

function upgradeTilesetJson(file, json, options) { // eslint-disable-line no-unused-vars
    var asset = json.asset;
    asset.version = '1.0';
    delete asset.gltfUpAxis;

    if (options.batchTableHierarchyAdded) {
        json.extensionsUsed = defaultValue(json.extensionsUsed, []);
        json.extensionsUsed.push('3DTILES_batch_table_hierarchy');
        json.extensionsRequired = defaultValue(json.extensionsRequired, []);
        json.extensionsRequired.push('3DTILES_batch_table_hierarchy');
    }

    var stack = [];
    stack.push(json.root);
    while (stack.length > 0) {
        var tile = stack.pop();
        var content = tile.content;
        if (defined(content)) {
            if (defined(content.url)) {
                // Change content.url to content.uri
                content.uri = content.url;
                delete content.url;
            }
            // Remove leading forward slash from uri
            if (content.uri.indexOf('/') === 0) {
                content.uri = content.uri.slice(1);
            }
        }

        if (defined(tile.refine)) {
            // Change add to ADD, replace to REPLACE
            tile.refine = tile.refine.toUpperCase();
        }

        // Push children to the stack
        var children = tile.children;
        if (defined(children)) {
            var length = children.length;
            for (var i = 0; i < length; ++i) {
                stack.push(children[i]);
            }
            // Remove zero-length arrays
            if (length === 0) {
                delete tile.children;
            }
        }
    }
    return json;
}

function upgradeI3dm(file, contents, options) {
    var i3dm = extractI3dm(contents);
    transferBatchTableHierarchy(i3dm, options);
    if (defined(i3dm.gltfUri)) {
        return Promise.resolve(createI3dm(i3dm));
    }
    return upgradeGlb(file, i3dm.glb, options)
        .then(function(glb) {
            i3dm.glb = glb;
            return createI3dm(i3dm);
        });
}

function transferRtcCenter(b3dm, gltf) {
    var extension = removeExtension(gltf, 'CESIUM_RTC');
    if (defined(extension)) {
        b3dm.featureTableJson.RTC_CENTER = extension.center;
    }
}

function changeUpAxis(gltf, gltfUpAxis) {
    if (!defined(gltfUpAxis) || gltfUpAxis === 'Y' || !defined(gltf.nodes)) {
        return;
    }

    var i;
    var nodes = gltf.nodes;
    var nodesLength = nodes.length;
    var isChild = arrayFill(new Array(nodesLength), false);

    for (i = 0; i < nodesLength; ++i) {
        var children = nodes[i].children;
        if (defined(children)) {
            var childrenLength = children.length;
            for (var j = 0; j < childrenLength; ++j) {
                isChild[children[j]] = true;
            }
        }
    }

    var rootNodes = [];

    for (i = 0; i < nodesLength; ++i) {
        if (!isChild[i]) {
            rootNodes.push(i);
        }
    }

    var name;
    var matrix;

    if (gltfUpAxis === 'X') {
        name = 'X_UP_TO_Y_UP';
        matrix = Axis.X_UP_TO_Y_UP;
    } else if (gltfUpAxis === 'Z') {
        name = 'Z_UP_TO_Y_UP';
        matrix = Axis.Z_UP_TO_Y_UP;
    }

    var rootIndex = gltf.nodes.length;

    gltf.nodes.push({
        children: rootNodes,
        matrix: Matrix4.toArray(matrix),
        name: name
    });

    var scenes = gltf.scenes;
    if (defined(scenes)) {
        scenes[0].nodes = [rootIndex];
    }
}

function transferBatchTableHierarchy(tile, options) {
    var batchTableJson = tile.batchTableJson;
    var batchTableHierarchy = batchTableJson.HIERARCHY;
    if (defined(batchTableHierarchy)) {
        batchTableJson.extensions = defaultValue(batchTableJson.extensions, {});
        batchTableJson.extensions['3DTILES_batch_table_hierarchy'] = batchTableHierarchy;
        delete batchTableJson.HIERARCHY;
        options.batchTableHierarchyAdded = true;
    }
}

function getTransferRtcCenterFunction(b3dm) {
    return function(gltf) {
        transferRtcCenter(b3dm, gltf);
        return gltf;
    }
}

function getChangeUpAxisFunction(gltfUpAxis) {
    return function(gltf) {
        changeUpAxis(gltf, gltfUpAxis);
        return gltf;
    }
}

function upgradeB3dm(file, contents, options) {
    var b3dm = extractB3dm(contents);
    transferBatchTableHierarchy(b3dm, options);
    var gltfOptions = {
        resourceDirectory: path.dirname(file),
        logger: options.logger,
        customStages: [
            getTransferRtcCenterFunction(b3dm),
            getChangeUpAxisFunction(options.gltfUpAxis)
        ]
    };
    return processGlb(b3dm.glb, gltfOptions)
        .then(function(results) {
            b3dm.glb = results.glb;
            return createB3dm(b3dm);
        });
}

function upgradePnts(file, contents, options) { // eslint-disable-line no-unused-vars
    var pnts = extractPnts(contents);
    transferBatchTableHierarchy(pnts, options);
    return Promise.resolve(createPnts(pnts));
}

function upgradeVctr(file, contents, options) { // eslint-disable-line no-unused-vars
    // Pass through
    return Promise.resolve(contents);
}

function upgradeGeom(file, contents, options) { // eslint-disable-line no-unused-vars
    // Pass through
    return Promise.resolve(contents);
}

function upgradeTile(file, contents, options) {
    var magic = getMagic(contents);
    switch (magic) {
        case 'b3dm':
            return upgradeB3dm(file, contents, options);
        case 'i3dm':
            return upgradeI3dm(file, contents, options);
        case 'pnts':
            return upgradePnts(file, contents, options);
        case 'vctr':
            return upgradeVctr(file, contents, options);
        case 'geom':
            return upgradeGeom(file, contents, options);
        case 'cmpt':
            return upgradeCmpt(file, contents, options);
        default:
            return Promise.resolve(contents);
    }
}

function upgradeCmpt(file, contents, options) {
    var tiles = extractCmpt(contents);
    var promises = [];
    var length = tiles.length;
    for (var i = 0; i < length; ++i) {
        promises.push(upgradeTile(file, tiles[i], options));
    }
    return Promise.all(promises)
        .then(function(tiles) {
            return createCmpt(tiles);
        });
}

function upgradeGltf(file, contents, options) {
    var gltfOptions = {
        resourceDirectory: path.dirname(file),
        logger: options.logger
    };
    return processGltf(contents, gltfOptions)
        .then(function(results) {
            return results.gltf;
        });
}

function upgradeGlb(file, contents, options) {
    var gltfOptions = {
        resourceDirectory: path.dirname(file),
        logger: options.logger,
        customStages: [
            getChangeUpAxisFunction(options.gltfUpAxis)
        ]
    };
    return processGlb(contents, gltfOptions)
        .then(function(results) {
            return results.glb;
        })
}

function upgradeOther(file, contents, options) { // eslint-disable-line no-unused-vars
    // Pass through
    return Promise.resolve(contents);
}

function upgradeHelper(files, type, upgradeCallback, options) {
    return Promise.map(files, function(file) {
        return readFile(file, type)
            .then(function(contents) {
                return upgradeCallback(file, contents, options);
            })
            .then(function(contents) {
                if (type === 'json') {
                    contents = Buffer.from(JSON.stringify(contents));
                } else if (type === 'text') {
                    contents = Buffer.from(contents);
                }
                var relativePath = path.relative(options.inputDirectory, file);
                return options.writer(relativePath, contents);
            });
    }, {concurrency: 100});
}

function upgradeFiles(files, options) {
    return Promise.all([
        upgradeHelper(files.tiles.b3dm, 'binary', upgradeB3dm, options),
        upgradeHelper(files.tiles.i3dm, 'binary', upgradeI3dm, options),
        upgradeHelper(files.tiles.pnts, 'binary', upgradePnts, options),
        upgradeHelper(files.tiles.vctr, 'binary', upgradeVctr, options),
        upgradeHelper(files.tiles.geom, 'binary', upgradeGeom, options),
        upgradeHelper(files.tiles.cmpt, 'binary', upgradeCmpt, options),
        upgradeHelper(files.other.gltf, 'json', upgradeGltf, options),
        upgradeHelper(files.other.glb, 'binary', upgradeGlb, options),
        upgradeHelper(files.other.other, 'binary', upgradeOther, options),
        upgradeHelper([files.tileset.root], 'json', upgradeTilesetJson, options),
        upgradeHelper(files.tileset.external, 'json', upgradeTilesetJson, options)
    ]);
}
