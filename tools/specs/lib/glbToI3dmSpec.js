'use strict';
var fs = require('fs');
var Promise = require('bluebird');
var extractI3dm = require('../../lib/extractI3dm');
var glbToI3dm = require('../../lib/glbToI3dm');

var fsReadFile = Promise.promisify(fs.readFile);

var glbPath = './specs/data/CesiumTexturedBox/CesiumTexturedBox.glb';
var i3dmPath = './specs/data/instancedTile.i3dm';

describe('glbToI3dm', function() {
    var glbBuffer;
    beforeAll(function(done) {
        fsReadFile(glbPath)
            .then(function(data) {
                glbBuffer = data;
                done();
            });
    });

    it('generates a basic i3dm header for a given buffer representing a glb', function() {
        var i3dmBuffer = glbToI3dm(glbBuffer);
        var header = i3dmBuffer.slice(0, 32);
        expect(header.toString('utf8', 0, 4)).toEqual('i3dm'); // magic
        expect(header.readUInt32LE(4)).toEqual(1); // version
        expect(header.readUInt32LE(8)).toEqual(glbBuffer.length + 32); // byteLength - length of entire tile, including header
        expect(header.readUInt32LE(12)).toEqual(0); // featureTableJSONByteLength - length of feature table json in bytes
        expect(header.readUInt32LE(16)).toEqual(0); // featureTableBinaryByteLength - length of feature table binary in bytes
        expect(header.readUInt32LE(20)).toEqual(0); // batchTableJSONByteLength - length of batch table json in bytes
        expect(header.readUInt32LE(24)).toEqual(0); // batchTableBinaryByteLength - length of batch table binary in bytes
        expect(header.readUInt32LE(28)).toEqual(1); // gltfFormat - format of the body field
        expect(i3dmBuffer.length).toEqual(glbBuffer.length + 32);
    });

    it('generates a i3dm with batch table placeholder', function() {
        var i3dmBuffer = glbToI3dm(glbBuffer, Buffer.alloc(10), Buffer.alloc(16), Buffer.alloc(20), Buffer.alloc(40), 1);
        var header = i3dmBuffer.slice(0, 32);
        expect(header.toString('utf8', 0, 4)).toEqual('i3dm'); // magic
        expect(header.readUInt32LE(4)).toEqual(1); // version
        expect(header.readUInt32LE(8)).toEqual(glbBuffer.length + 32 + 10 + 16 + 20 + 40); // byteLength - length of entire tile, including header
        expect(header.readUInt32LE(12)).toEqual(10); // featureTableJSONByteLength - length of feature table json in bytes
        expect(header.readUInt32LE(16)).toEqual(16); // featureTableBinaryByteLength - length of feature table binary in bytes
        expect(header.readUInt32LE(20)).toEqual(20); // batchTableJSONByteLength - length of batch table json in bytes
        expect(header.readUInt32LE(24)).toEqual(40); // batchTableBinaryByteLength - length of batch table binary in bytes
        expect(header.readUInt32LE(28)).toEqual(1); // gltfFormat - format of the body field
    });

    it('throws an error if no glbBuffer is provided', function() {
        expect(function() {
            glbToI3dm();
        }).toThrowError('glbBuffer is not defined.');
    });

    it('convert i3dm to glb and back to i3dm', function() {
        expect(fsReadFile(i3dmPath)
                .then(function(fileBuffer) {
                    var i3dm = extractI3dm(fileBuffer);
                    var i3dmOut = glbToI3dm(i3dm.glb, i3dm.featureTable.json, i3dm.featureTable.binary,
                            i3dm.batchTable.json, i3dm.batchTable.binary, i3dm.header.gltfFormat);
                    expect(i3dm).toEqual(i3dmOut)
                }), done).toResolve();
    });
});
