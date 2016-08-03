#!/usr/bin/env node
'use strict';

var Cesium = require('cesium');
var fs = require('fs-extra');
var path = require('path');
var Promise = require('bluebird');
var yargs = require('yargs');
var zlib = require('zlib');

var fsEnsureDir = Promise.promisify(fs.ensureDir);
var fsReadFile = Promise.promisify(fs.readFile);

var defaultValue = Cesium.defaultValue;

module.exports = gzipTileset;

var argv = yargs
    .help('help')
    .alias('help', 'h')
    .string('input')
    .demand('input')
    .describe('input', 'Input directory')
    .alias('input', 'i')
    .string('output')
    .describe('output', 'Output directory')
    .alias('output', 'o')
    .argv;

gzipTileset(argv.input, argv.output);

/**
 * Detects whether the tileset is compressed or not and does the opposite.
 *
 * @param {String} inputPath Path to the tileset directory or tileset.json file.
 * @param {Object} [outputDirectory] Path to the output directory.
 */
function gzipTileset(inputPath, outputDirectory) {
    inputPath = path.normalize(inputPath);

    var tilesetPath = inputPath;
    if (!isJson(tilesetPath)) {
        tilesetPath = path.join(inputPath, 'tileset.json');
    }
    var tilesetDirectory = path.dirname(tilesetPath);

    fsReadFile(tilesetPath)
        .then(function (data) {
            var gzip = !isGzipped(data);

            outputDirectory = path.normalize(defaultValue(outputDirectory,
                path.join(path.dirname(tilesetDirectory), path.basename(tilesetDirectory) + '-' + (gzip ? 'gzipped' : 'gunzipped'))));

            console.log('Input directory: ' + tilesetDirectory);
            console.log('Output directory: ' + outputDirectory);

            var files = [];
            fs.walk(tilesetDirectory)
                .on('data', function (item) {
                    if (!item.stats.isDirectory()) {
                        files.push(path.relative(tilesetDirectory, item.path));
                    }
                })
                .on('end', function () {
                    console.log(files.length + ' files found.');

                    process.stdout.write((gzip ? 'Compressing' : 'Uncompressing') + ' files...');
                    Promise.map(files, function (file) {
                        var outFile = path.join(outputDirectory, file);
                        return fsEnsureDir(path.dirname(outFile))
                            .then(function () {
                                var inp = fs.createReadStream(path.join(tilesetDirectory, file));
                                var out = fs.createWriteStream(path.join(outputDirectory, file));
                                var operation = gzip ? zlib.createGzip() : zlib.createGunzip();
                                return streamToPromise(inp.pipe(operation).pipe(out));
                            });
                    }, {concurrency: 1024})
                        .then(function () {
                            console.log('Done!');
                        })
                        .catch(function (e) {
                            console.log('Failed: ' + e);
                        });
                });
        })
        .catch(function () {
            console.error('Can\'t open tileset.json');
            process.exit(1);
        });
}

function isGzipped(data) {
    return (data[0] === 0x1f) && (data[1] === 0x8b);
}

function streamToPromise(stream) {
    return new Promise(function(resolve, reject) {
        stream.on('finish', resolve);
        stream.on('end', reject);
    });
}

function isJson(path) {
    return path.slice(-5) === '.json';
}
