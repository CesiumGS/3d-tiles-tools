'use strict';
var glbToPlainB3dm = require('../../lib/glbToPlainB3dm');
var fs = require('fs');
var Promise = require('bluebird');

var fsReadFile = Promise.promisify(fs.readFile);

var gltfPath = './specs/data/CesiumTexturedBox/CesiumTexturedBox.glb';

describe('glbToPlainB3dm', function() {

    var glbBuffer;
    beforeAll(function(done) {
        fsReadFile(gltfPath)
            .then(function(data) {
                glbBuffer = data;
                done();
            });
    });

    it('generates a basic b3dm header for a given buffer representing a glb', function() {
        var b3dmBuffer = glbToPlainB3dm(glbBuffer);
        var header = b3dmBuffer.slice(0, 20); // magic
        expect(header.toString('utf8', 0, 4)).toEqual('b3dm');
        expect(header.readUInt32LE(4)).toEqual(1); // version
        expect(header.readUInt32LE(8)).toEqual(glbBuffer.length + 20); // length of entire tile, including header
        expect(header.readUInt32LE(12)).toEqual(0); // number of models in the batch (0 for basic, no batches)
        expect(header.readUInt32LE(16)).toEqual(0); // length of batch table in bytes
        expect(b3dmBuffer.length).toEqual(glbBuffer.length + 20);
    });
});
