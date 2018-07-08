'use strict';
var Cesium = require('cesium');
var path = require('path');
var Promise = require('bluebird');
var sqlite3 = require('sqlite3');
var zlib = require('zlib');
var getDefaultLogger = require('./getDefaultLogger');
var getDefaultWriter = require('./getDefaultWriter');
var isGzipped = require('./isGzipped');

var Check = Cesium.Check;
var defaultValue = Cesium.defaultValue;

module.exports = databaseToTileset;

/**
 * Unpacks a .3dtiles database to a tileset folder.
 *
 * @param {Object} options An object with the following properties:
 * @param {String} options.inputFile Path to the input .3dtiles database file.
 * @param {Object} [options.outputDirectory] Path to the output directory.
 * @param {Writer} [options.writer] A callback function that writes files after they have been processed.
 * @param {Logger} [options.logger] A callback function that logs messages. Defaults to console.log.
 *
 * @returns {Promise} A promise that resolves when the tileset is written.
 */
function databaseToTileset(options) {
    options = defaultValue(options, defaultValue.EMPTY_OBJECT);
    Check.typeOf.string('options.inputFile', options.inputFile);

    var inputFile = options.inputFile;
    var outputDirectory = defaultValue(options.outputDirectory, path.join(path.dirname(inputFile), path.basename(inputFile, path.extname(inputFile))));

    var writer = defaultValue(options.writer, getDefaultWriter(outputDirectory));
    var logger = defaultValue(options.logger, getDefaultLogger());
    logger('Converting database to tileset');

    // Open the database.
    var db = new sqlite3.Database(inputFile, sqlite3.OPEN_READWRITE);
    var dbAll = Promise.promisify(db.all, {context: db});

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
                    return writeFile(writer, row.key, row.content);
                })
                    .then(function() {
                        return processChunk();
                    });
            });
    };

    return processChunk().finally(function() {
        db.close();
    });
}

function writeFile(writer, file, contents) {
    if (isGzipped(contents)) {
        contents = zlib.gunzipSync(contents);
    }
    return writer(file, contents);
}
