'use strict';
var childProcess = require('child_process');
var fs = require('fs-extra');
var Promise = require('bluebird');
var rimraf = require('rimraf');

var fsReadFile = Promise.promisify(fs.readFile);
var rimrafAsync = Promise.promisify(rimraf);

var inputGlbPath = './specs/data/CesiumTexturedBox/CesiumTexturedBox.glb';
var outputGlbPath = './specs/data/.test/CesiumTexturedBoxRenamed.b3dm';
var testOutputPath = './specs/data/.test/';

describe('generateB3dmFromGlb cli', function() {
    var glbBuffer;
    beforeAll(function(done) {
        fsReadFile(inputGlbPath)
            .then(function(data) {
                glbBuffer = data;
                done();
            });
    });

    afterAll(function(done) {
        rimrafAsync(testOutputPath, {})
            .then(done);
    });

    it('repackages a glb as a b3dm', function(done) {
        expect(generateB3dmFromGlb(['-i', inputGlbPath, '-o', outputGlbPath])
            .then(function() {
                return fsReadFile(outputGlbPath);
            })
            .then(function(b3dmBuffer) {
                var header = b3dmBuffer.slice(0, 24);
                expect(header.toString('utf8', 0, 4)).toEqual('b3dm'); // magic
                expect(header.readUInt32LE(4)).toEqual(1); // version
                expect(header.readUInt32LE(8)).toEqual(glbBuffer.length + 24); // byteLength - length of entire tile, including header
                expect(header.readUInt32LE(12)).toEqual(0); // batchTableJSONByteLength - length of batch table json in bytes
                expect(header.readUInt32LE(16)).toEqual(0); // batchTableBinaryByteLength - length of batch table binary in bytes
                expect(header.readUInt32LE(20)).toEqual(0); // batchLength - number of models in the batch (0 for basic, no batches)
                expect(b3dmBuffer.length).toEqual(glbBuffer.length + 24);
            }), done).toResolve();
    });
});

function generateB3dmFromGlb(args) {
    var generateB3dmFromGlbProcess = childProcess.fork('./bin/generateB3dmFromGlb', args);
    return new Promise(function(resolve, reject) {
        generateB3dmFromGlbProcess.on('close', function() {
            resolve();
        });
        generateB3dmFromGlbProcess.on('error', function() {
            reject();
        });
    });
}
