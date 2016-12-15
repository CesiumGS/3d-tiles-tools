#!/usr/bin/env node
'use strict';

var Cesium = require('cesium');
var fs = require('fs');
var fsExtra = require('fs-extra');
var path = require('path');
var Promise = require('bluebird');
var sqlite3 = require('sqlite3');
var zlib = require('zlib');
var isGzipped = require('../lib/isGzipped');

var fsReadFile = Promise.promisify(fs.readFile);

var defaultValue = Cesium.defaultValue;
var defined = Cesium.defined;
var DeveloperError = Cesium.DeveloperError;

module.exports = tileset2sqlite3;

function tileset2sqlite3(inputDirectory, outputFile, force) {
    if (!defined(inputDirectory)) {
        throw new DeveloperError('inputDirectory is required.');
    }
    if (!defined(outputFile)) {
        throw new DeveloperError('outputFile is required.');
    }

    force = defaultValue(force, false);

    if (!/\.3dtiles$/.test(outputFile)) {
        outputFile += '.3dtiles';
    }

    if (!force && fs.existsSync(outputFile)) {
        console.log();
        console.log('Refusing to overwrite existing database.');
        return;
    }

    //Create the database.
    var db = new sqlite3.Database(outputFile, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE);
    var dbRun = Promise.promisify(db.run, {context : db});

    //Disable journaling and create the table.
    return dbRun("PRAGMA journal_mode=off;")
        .then(function() {
            return dbRun('BEGIN');
        })
        .then(function() {
            return dbRun("CREATE TABLE media (key TEXT PRIMARY KEY, content BLOB)");
        })
        .then(function() {
            //Build the collection of file paths to be inserted.
            var filepaths = [];
            var stream = fsExtra.walk(inputDirectory);
            stream.on('readable', function() {
                var filePath = stream.read();
                while (defined(filePath)) {
                    if (filePath.stats.isFile()) {
                        filepaths.push(filePath.path);
                    }
                    filePath = stream.read();
                }
            });

            return new Promise(function(resolve, reject) {
                stream.on('error', reject);
                stream.on('end', resolve);
            }).thenReturn(filepaths);
        })
        .then(function(filepaths) {
            return Promise.map(filepaths, function(filepath) {
                return fsReadFile(filepath)
                    .then(function(data) {
                        filepath = path.normalize(path.relative(inputDirectory, filepath)).replace(/\\/g, '/');
                        if (!isGzipped(data)) {
                            data = zlib.gzipSync(data);
                        }
                        return dbRun("INSERT INTO media VALUES (?, ?)", [filepath, data]);
                    });
            }, {concurrency : 100});
        })
        .then(function() {
            return dbRun('COMMIT');
        })
        .catch(function(error) {
            console.log(error);
        })
        .finally(function() {
            db.close();
        });
}
