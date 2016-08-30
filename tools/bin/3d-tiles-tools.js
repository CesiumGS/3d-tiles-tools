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
        '    ungzip  Ungzips the input tileset.\n' +
        '        -i --input, input=PATH The input tileset directory.\n' +
        '        -o --output, output=PATH The output tileset directory.\n';
    console.log(help);
    return;
}

var command = argv._[0];
var inputDirectory = defaultValue(defaultValue(argv.i, argv.input), argv._[1]);

if (!defined(inputDirectory)) {
    console.log('-i or --input argument is required. See --help for details.');
    return;
}

inputDirectory = path.normalize(inputDirectory);

var options = {
    verbose : true
};

if (command === 'pipeline') {
    console.time('Total');
    fsExtraReadJson(inputDirectory)
        .then(function(pipeline) {
            // Make input and output relative to the root directory
            if (defined(pipeline.input)) {
                pipeline.input = path.join(path.dirname(inputDirectory), pipeline.input);
            }
            if (defined(pipeline.output)) {
                pipeline.output = path.join(path.dirname(inputDirectory), pipeline.output);
            }
            runPipeline(pipeline, options)
                .then(function() {
                    console.timeEnd('Total');
                });
        });
    return;
}

var outputDirectory = defaultValue(defaultValue(argv.o, argv.output), argv._[2]);
outputDirectory = path.normalize(defaultValue(outputDirectory,
    path.join(path.dirname(inputDirectory), path.basename(inputDirectory) + '-processed')));

var stage = getStage(command, argv);

var pipeline = {
    input : inputDirectory,
    output : outputDirectory,
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
        case 'ungzip':
            if (defined(argv.t) || defined(argv.tilesOnly)) {
                stage.tilesOnly = true;
            }
            break;
    }
    return stage;
}
