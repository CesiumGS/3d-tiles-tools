#!/usr/bin/env node
'use strict';
var argv = require('yargs').argv;
var Cesium = require('cesium');
var fsExtra = require('fs-extra');
var path = require('path');
var Promise = require('bluebird');
var runPipeline = require('../lib/runPipeline');

var fsExtraReadJson = Promise.promisify(fsExtra.readJson);

var defaultValue = Cesium.defaultValue;
var defined = Cesium.defined;

if (process.argv.length < 4 || defined(argv.h) || defined(argv.help) || !defined(argv._[0])) {
    var help =
        'Usage: node ' + path.basename(__filename) + ' command [args]\n' +
        'Possible commands:\n' +
        '    pipeline  Execute the input pipeline JSON file.\n' +
        '        -i --input, input=PATH The input pipeline JSON file.\n' +
        '    gzip  Gzips the input tileset.\n' +
        '        -i --input, input=PATH The input tileset directory.\n' +
        '        -o --output, output=PATH The output tileset directory.\n' +
        '        -t --tilesOnly, Only gzip tiles.\n' +
        '    gunzip  Gunzips the input tileset.\n' +
        '        -i --input, input=PATH The input tileset directory.\n' +
        '        -o --output, output=PATH The output tileset directory.\n';
    console.log(help);
    return;
}

var command = argv._[0];
var inputPath = defaultValue(argv.i, argv.input);

if (!defined(inputPath)) {
    console.log('-i or --input argument is required. See --help for details.');
    return;
}

inputPath = path.normalize(inputPath);

var options = {
    verbose : true
};

if (command === 'pipeline') {
    console.time('Total');
    fsExtraReadJson(inputPath)
        .then(function(pipeline) {
            // Make input and output relative to the root directory
            if (defined(pipeline.input)) {
                pipeline.input = path.join(path.dirname(inputPath), pipeline.input);
            }
            if (defined(pipeline.output)) {
                pipeline.output = path.join(path.dirname(inputPath), pipeline.output);
            }
            runPipeline(pipeline, options)
                .then(function() {
                    console.timeEnd('Total');
                });
        });
    return;
}

var outputPath = defaultValue(argv.o, argv.output);
outputPath = path.normalize(defaultValue(outputPath,
    path.join(path.dirname(inputPath), path.basename(inputPath) + '-processed')));

var stage = getStage(command, argv);

var pipeline = {
    input : inputPath,
    output : outputPath,
    stages : [stage]
};

console.time('Total');
runPipeline(pipeline, options)
    .then(function() {
        console.timeEnd('Total');
    });

function getStage(stageName, argv) {
    var stage = {
        name : stageName
    };
    switch (stageName) {
        case 'gzip':
        case 'gunzip':
            if (defined(argv.t) || defined(argv['tilesOnly'])) {
                stage.tilesOnly = true;
            }
            break;
    }
    return stage;
}
