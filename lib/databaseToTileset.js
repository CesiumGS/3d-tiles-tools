'use strict';
const Cesium = require('cesium');
const fsExtra = require('fs-extra');
const path = require('path');
const Promise = require('bluebird');
const sqlite3 = require('sqlite3');
const zlib = require('zlib');
const isGzipped = require('../lib/isGzipped');

const defaultValue = Cesium.defaultValue;
const defined = Cesium.defined;
const DeveloperError = Cesium.DeveloperError;

module.exports = databaseToTileset;

/**
 * Unpacks a .3dtiles database to a tileset folder.
 *
 * @param {String} inputFile The input .3dtiles database file.
 * @param {String} [outputDirectory] The output directory of the tileset.
 * @returns {Promise} A promise that resolves when the tileset is written.
 */
function databaseToTileset(inputFile, outputDirectory) {
    if (!defined(inputFile)) {
        throw new DeveloperError('inputFile is required.');
    }

    outputDirectory = defaultValue(outputDirectory, path.join(path.dirname(inputFile), path.basename(inputFile, path.extname(inputFile))));

    // Open the database.
    const db = new sqlite3.Database(inputFile, sqlite3.OPEN_READWRITE);
    const dbAll = Promise.promisify(db.all, {context : db});

    // Read a chunk of rows from the database at a time. Since the row contents contain tile blobs the limit should not be too high.
    let offset = 0;
    const limit = 100;
    const processChunk = function() {
        return dbAll('SELECT * FROM media LIMIT ? OFFSET ?', limit, offset)
            .then(function(rows) {
                if (rows.length === 0) {
                    // No more rows left
                    return Promise.resolve();
                }
                return Promise.map(rows, function(row) {
                    ++offset;
                    return writeFile(outputDirectory, row.key, row.content);
                })
                    .then(function () {
                        return processChunk();
                    });
            });
    };

    return processChunk().finally(function() {
        db.close();
    });
}

function writeFile(outputDirectory, file, data) {
    const filePath = path.normalize(path.join(outputDirectory, file));
    if (isGzipped(data)) {
        data = zlib.gunzipSync(data);
    }
    return fsExtra.outputFile(filePath, data);
}
