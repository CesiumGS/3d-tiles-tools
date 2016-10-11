'use strict';
var fs = require('fs');
var Promise = require('bluebird');
var glbToB3dm = require('../../lib/glbToB3dm');

var fsReadFile = Promise.promisify(fs.readFile);

var glbPath = './specs/data/CesiumTexturedBox/CesiumTexturedBox.glb';

describe('glbToB3dm', function() {
    var glbBuffer;
    beforeAll(function(done) {
        fsReadFile(glbPath)
            .then(function(data) {
                glbBuffer = data;
                done();
            });
    });

    it('generates a basic b3dm header for a given buffer representing a glb', function() {
        var b3dmBuffer = glbToB3dm(glbBuffer);
        var header = b3dmBuffer.slice(0, 24);
        expect(header.toString('utf8', 0, 4)).toEqual('b3dm'); // magic
        expect(header.readUInt32LE(4)).toEqual(1); // version
        expect(header.readUInt32LE(8)).toEqual(glbBuffer.length + 24); // byteLength - length of entire tile, including header
        expect(header.readUInt32LE(12)).toEqual(0); // batchTableJSONByteLength - length of batch table json in bytes
        expect(header.readUInt32LE(16)).toEqual(0); // batchTableBinaryByteLength - length of batch table binary in bytes
        expect(header.readUInt32LE(20)).toEqual(0); // batchLength - number of models in the batch (0 for basic, no batches)
        expect(b3dmBuffer.length).toEqual(glbBuffer.length + 24);
    });

    it('throws an error if no glbBuffer is provided', function() {
        expect(function() {
            glbToB3dm();
        }).toThrowError('glbBuffer is not defined.');
    });
});
