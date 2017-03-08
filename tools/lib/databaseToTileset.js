'use strict';
var Cesium = require('cesium');
var fsExtra = require('fs-extra');
var path = require('path');
var Promise = require('bluebird');
var sqlite3 = require('sqlite3');
var zlib = require('zlib');
var isGzipped = require('../lib/isGzipped');

var fsExtraOutputFile = Promise.promisify(fsExtra.outputFile);

var defaultValue = Cesium.defaultValue;
var defined = Cesium.defined;
var DeveloperError = Cesium.DeveloperError;

module.exports = databaseToTileset;

function databaseToTileset(inputFile, outputDirectory) {
    if (!defined(inputFile)) {
        throw new DeveloperError('inputFile is required.');
    }

    outputDirectory = defaultValue(outputDirectory, path.join(path.dirname(inputFile), path.basename(inputFile, path.extname(inputFile))));

    // Open the database.
    var db = new sqlite3.Database(inputFile, sqlite3.OPEN_READWRITE);
    var dbAll = Promise.promisify(db.all, {context : db});

    // Read a chunk of rows from the database at a time. Since the row contents contain tile blobs the limit should not be too high.
    var offset = 0;
    var limit = 100;
    var processChunk = function() {
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
    var filePath = path.normalize(path.join(outputDirectory, file));
    if (isGzipped(data)) {
        data = zlib.gunzipSync(data);
    }
    return fsExtraOutputFile(filePath, data);
}
