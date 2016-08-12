#!/usr/bin/env node
'use strict';

var yargs = require('yargs');

var gzipTileset = require('../lib/gzipTileset');

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

gzipTileset(argv.input, argv.output, false, true)
    .then(function() {
        console.log('Done');
    });
