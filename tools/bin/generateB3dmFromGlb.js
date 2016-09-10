#!/usr/bin/env node
'use strict';
var Cesium = require('cesium');
var fsExtra = require('fs-extra');
var glbToB3dm = require('../lib/glbToB3dm');
var Promise = require('bluebird');

var defaultValue = Cesium.defaultValue;

var fsReadFile = Promise.promisify(fsExtra.readFile);
var fsWriteFile = Promise.promisify(fsExtra.outputFile);

var argv = require('yargs')
    .usage('Usage: $0 -i [glb with embedded resources] -o [b3dm output path]')
    .demand(['i'])
    .argv;

var inputPath = argv.i;

// Default output is just in the same place as input, but with 'b3dm'
var outputPath = defaultValue(argv.o, inputPath.slice(0, inputPath.length - 3) + 'b3dm');

// Load the glb
return fsReadFile(inputPath)
    .then(function(data) {
        return fsWriteFile(outputPath, glbToB3dm(data));
    });
