'use strict';
const Cesium = require('cesium');
const path = require('path');
const Promise = require('bluebird');
const zlib = require('zlib');
const extractB3dm = require('./extractB3dm');
const extractCmpt = require('./extractCmpt');
const getDefaultWriteCallback = require('./getDefaultWriteCallback');
const getMagic = require('./getMagic');
const glbToB3dm = require('./glbToB3dm');
const isGzippedFile = require('./isGzippedFile');
const isJson = require('./isJson');
const isTile = require('./isTile');
const makeCompositeTile = require('./makeCompositeTile');
const optimizeGlb = require('./optimizeGlb');
const readFile = require('./readFile');
const walkDirectory = require('./walkDirectory');

const Check = Cesium.Check;
const defaultValue = Cesium.defaultValue;
const defined = Cesium.defined;

module.exports = upgradeTileset;

/**
 * Upgrades the input tileset to the latest version of the 3D Tiles spec. Embedded glTF models will be upgraded to glTF 2.0.
 *
 * @param {Object} options Object with the following properties:
 * @param {String} options.inputDirectory Path to the input directory.
 * @param {Object} [options.outputDirectory] Path to the output directory.
 * @param {WriteCallback} [options.writeCallback] A callback function that writes files after they have been processed.
 * @param {LogCallback} [options.logCallback] A callback function that logs messages.
 *
 * @returns {Promise} A promise that resolves when the operation completes.
 */
function upgradeTileset(options) {
    options = defaultValue(options, defaultValue.EMPTY_OBJECT);
    let inputDirectory = options.inputDirectory;
    let outputDirectory = options.outputDirectory;

    Check.typeOf.string('options.inputDirectory', inputDirectory);

    inputDirectory = path.normalize(inputDirectory);
    outputDirectory = path.normalize(defaultValue(outputDirectory,
        path.join(path.dirname(inputDirectory), `${path.basename(inputDirectory)  }-upgrades`)));

    const writeCallback = defaultValue(options.writeCallback, getDefaultWriteCallback(outputDirectory));
    const logCallback = options.logCallback;

    if (defined(logCallback)) {
        logCallback('Upgrading to 3D Tiles version 1.0');
    }

    return walkDirectory(inputDirectory, function(file) {
        return isGzippedFile(file)
            .then(function(gzipped) {
                return upgradeFile(file)
                    .then(function(data) {
                        if (gzipped) {
                            data = zlib.gzipSync(data);
                        }
                        const relativePath = path.relative(inputDirectory, file);
                        return writeCallback(relativePath, data);
                    });
            });
    });
}

function upgradeFile(file) {
    if (isJson(file)) {
        return upgradeTilesetJson(file);
    } else if (isTile(file)) {
        return upgradeTile(file);
    }
    return readFile(file);
}

function upgradeTilesetJson(file) {
    return readFile(file, 'text')
        .then(function(contents) {
            contents = contents.replace(/"version": ".*"/g, '"version": "1.0"');
            contents = contents.replace(/"add"/g, '"ADD"');
            contents = contents.replace(/"replace"/g, '"REPLACE"');
            return Buffer.from(contents);
        });
}

const optimizeOptions = {
    preserve : true
};

function upgradeTile(file) {
    return readFile(file)
        .then(function(buffer) {
            return upgradeTileContent(buffer, path.dirname(file));
        });
}

function upgradeTileContent(buffer, basePath) {
    const magic = getMagic(buffer);
    if (magic === 'b3dm') {
        const b3dm = extractB3dm(buffer);
        return optimizeGlb(b3dm.glb, Object.assign({}, optimizeOptions, {basePath: basePath}))
            .then(function(glb) {
                return glbToB3dm(glb, b3dm.featureTable.json, b3dm.featureTable.binary, b3dm.batchTable.json, b3dm.batchTable.binary);
            });
    } else if (magic === 'cmpt') {
        const tiles = extractCmpt(buffer);
        return Promise.map(tiles, function(tile) {
            return upgradeTileContent(tile, basePath);
        }).then(function(upgradedTiles) {
            return makeCompositeTile(upgradedTiles);
        });
    }
    return buffer;
}
