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

module.exports = tilesetToDatabase;

function tilesetToDatabase(inputFile, outputDirectory) {
    if (!defined(inputFile)) {
        throw new DeveloperError('inputFile is required.');
    }

    outputDirectory = defaultValue(outputDirectory, path.join(path.dirname(inputFile), path.basename(inputFile, path.extname(inputFile))));

    // Open the database.
    var db = new sqlite3.Database(inputFile, sqlite3.OPEN_READWRITE);
    var dbGet = Promise.promisify(db.get, {context : db});

    // Get number of rows
    return dbGet('SELECT Count(*) AS total FROM media')
        .then(function(row) {
            return row.total;
        })
        .then(function(total) {
            var promises = new Array(total);
            for (var i = 0; i < total; ++i) {
                promises[i] = readAndWriteFile(outputDirectory, dbGet, i);
            }
            return Promise.all(promises);
        })
        .finally(function() {
            db.close();
        });
}

function readAndWriteFile(outputDirectory, dbGet, index) {
    return dbGet('SELECT * FROM media LIMIT 1 OFFSET ?', index)
        .then(function(row) {
            var filePath = path.normalize(path.join(outputDirectory, row.key));
            var data = row.content;
            if (isGzipped(data)) {
                data = zlib.gunzipSync(data);
            }
            return fsExtraOutputFile(filePath, data);
        });
}