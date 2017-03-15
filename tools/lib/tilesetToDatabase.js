'use strict';
var Cesium = require('cesium');
var fsExtra = require('fs-extra');
var path = require('path');
var Promise = require('bluebird');
var sqlite3 = require('sqlite3');
var zlib = require('zlib');
var fileExists = require('../lib/fileExists');
var isGzipped = require('../lib/isGzipped');
var isTile = require('../lib/isTile');

var fsExtraReadFile = Promise.promisify(fsExtra.readFile);
var fsExtraRemove = Promise.promisify(fsExtra.remove);

var defaultValue = Cesium.defaultValue;
var defined = Cesium.defined;
var DeveloperError = Cesium.DeveloperError;

module.exports = tilesetToDatabase;


/**
 * Generates a sqlite database for a tileset, saved as a .3dtiles file.
 *
 * @param {String} inputDirectory The input directory of the tileset.
 * @param {String} [outputFile] The output .3dtiles database file.
 * @returns {Promise} A promise that resolves when the database is written.
 */
function tilesetToDatabase(inputDirectory, outputFile) {
    if (!defined(inputDirectory)) {
        throw new DeveloperError('inputDirectory is required.');
    }

    outputFile = defaultValue(outputFile,
        path.join(path.dirname(inputDirectory), path.basename(inputDirectory) + '.3dtiles'));

    return fileExists(outputFile)
        .then(function(exists) {
            if (exists) {
                // Delete the .3dtiles file if it already exists
                return fsExtraRemove(outputFile);
            }
        })
        .then(function() {
            // Create the database.
            var db = new sqlite3.Database(outputFile, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE);
            var dbRun = Promise.promisify(db.run, {context : db});

            // Disable journaling and create the table.
            return dbRun('PRAGMA journal_mode=off;')
                .then(function() {
                    return dbRun('BEGIN');
                })
                .then(function() {
                    return dbRun('CREATE TABLE media (key TEXT PRIMARY KEY, content BLOB)');
                })
                .then(function() {
                    //Build the collection of file paths to be inserted.
                    var filePaths = [];
                    var stream = fsExtra.walk(inputDirectory);
                    stream.on('readable', function() {
                        var filePath = stream.read();
                        while (defined(filePath)) {
                            if (filePath.stats.isFile()) {
                                filePaths.push(filePath.path);
                            }
                            filePath = stream.read();
                        }
                    });

                    return new Promise(function(resolve, reject) {
                        stream.on('error', reject);
                        stream.on('end', resolve);
                    }).thenReturn(filePaths);
                })
                .then(function(filePaths) {
                    return Promise.map(filePaths, function(filePath) {
                        return fsExtraReadFile(filePath)
                            .then(function(data) {
                                filePath = path.normalize(path.relative(inputDirectory, filePath)).replace(/\\/g, '/');
                                // Only gzip tiles and json files. Other files like external textures should not be gzipped.
                                var shouldGzip = isTile(filePath) || path.extname(filePath) === '.json';
                                if (shouldGzip && !isGzipped(data)) {
                                    data = zlib.gzipSync(data);
                                }
                                return dbRun('INSERT INTO media VALUES (?, ?)', [filePath, data]);
                            });
                    }, {concurrency : 100});
                })
                .then(function() {
                    return dbRun('COMMIT');
                })
                .finally(function() {
                    db.close();
                });
        });
}
