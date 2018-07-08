'use strict';
var Cesium = require('cesium');
var fsExtra = require('fs-extra');
var path = require('path');
var Promise = require('bluebird');
var sqlite3 = require('sqlite3');
var zlib = require('zlib');
var getDefaultLogger = require('./getDefaultLogger');
var getFilesCategorized = require('./getFilesCategorized');
var getFilesInDirectory = require('./getFilesInDirectory');
var isGzipped = require('./isGzipped');
var isJson = require('./isJson');
var isTile = require('./isTile');
var readFile = require('./readFile');

var Check = Cesium.Check;
var defaultValue = Cesium.defaultValue;
var defined = Cesium.defined;
var RuntimeError = Cesium.RuntimeError;

module.exports = tilesetToDatabase;

/**
 * Generates a sqlite database for a tileset, saved as a .3dtiles file.
 *
 * @param {Object} options An object with the following properties:
 * @param {String} options.inputDirectory Path to the input directory.
 * @param {Object} [options.outputFile] Path to the output database file.
 * @param {Logger} [options.logger] A callback function that logs messages. Defaults to console.log.
 *
 * @returns {Promise} A promise that resolves when the database is written.
 */
function tilesetToDatabase(options) {
    options = defaultValue(options, defaultValue.EMPTY_OBJECT);
    Check.typeOf.string('options.inputDirectory', options.inputDirectory);

    var inputDirectory = options.inputDirectory;
    var outputFile = defaultValue(options.outputFile, path.join(path.dirname(inputDirectory), path.basename(inputDirectory) + '.3dtiles'));

    var logger = defaultValue(options.logger, getDefaultLogger());
    logger('Converting tileset to database');

    var db;
    var dbRun;
    // Delete the .3dtiles file if it already exists
    return Promise.resolve(fsExtra.remove(outputFile))
        .then(function() {
            // Create the database.
            db = new sqlite3.Database(outputFile, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE);
            dbRun = Promise.promisify(db.run, {context: db});

            // Disable journaling and create the table.
            return dbRun('PRAGMA journal_mode=off;');
        })
        .then(function() {
            return dbRun('BEGIN');
        })
        .then(function() {
            return dbRun('CREATE TABLE media (key TEXT PRIMARY KEY, content BLOB)');
        })
        .then(function() {
            return getFilesCategorized(inputDirectory);
        })
        .then(function(files) {
            var rootTileset = files.tileset.root;
            if (!inTopLevel(inputDirectory, rootTileset)) {
                throw new RuntimeError('The root tileset JSON must be in the top-level input directory');
            }
            return getFilesInDirectory(inputDirectory)
                .then(function(files) {
                    return Promise.map(files, function(file) {
                        return readFile(file)
                            .then(function(contents) {
                                if (file === rootTileset) {
                                    // Database format requires the root tileset to be named tileset.json
                                    file = 'tileset.json';
                                } else {
                                    file = path.normalize(path.relative(inputDirectory, file)).replace(/\\/g, '/');
                                }
                                // Only gzip tiles and json files. Other files like external textures should not be gzipped.
                                var shouldGzip = isTile(file) || isJson(file);
                                if (shouldGzip && !isGzipped(contents)) {
                                    contents = zlib.gzipSync(contents);
                                }
                                return dbRun('INSERT INTO media VALUES (?, ?)', [file, contents]);
                            });
                    }, {concurrency: 100});
                });
        })
        .then(function() {
            return dbRun('COMMIT');
        })
        .finally(function() {
            if (defined(db)) {
                db.close();
            }
        });
}

function inTopLevel(directory, file) {
    return path.relative(directory, file) === path.basename(file);
}
