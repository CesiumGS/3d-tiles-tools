'use strict';
var fs = require('fs');
var extractB3dm = require('../../lib/extractB3dm');
var getBufferPadded = require('../../lib/getBufferPadded');
var getJsonBufferPadded = require('../../lib/getJsonBufferPadded');
var glbToB3dm = require('../../lib/glbToB3dm');

var glbPath = './specs/data/CesiumTexturedBox/CesiumTexturedBox.glb';
var b3dmPath = './specs/data/batchedWithBatchTableBinary.b3dm';

describe('glbToB3dm', function() {
    var glbBuffer;

    beforeAll(function() {
        glbBuffer = fs.readFileSync(glbPath);
    });

    it('generates a basic b3dm header for a glb', function() {
        var headerByteLength = 28;
        var byteLength = headerByteLength + glbBuffer.length;
        var b3dmBuffer = glbToB3dm(glbBuffer);
        var header = b3dmBuffer.slice(0, headerByteLength);
        expect(header.toString('utf8', 0, 4)).toEqual('b3dm');  // magic
        expect(header.readUInt32LE(4)).toEqual(1);              // version
        expect(header.readUInt32LE(8)).toEqual(byteLength);     // byteLength
        expect(header.readUInt32LE(12)).toEqual(0);             // featureTableJSONByteLength
        expect(header.readUInt32LE(16)).toEqual(0);             // featureTableBinaryByteLength
        expect(header.readUInt32LE(20)).toEqual(0);             // batchTableJSONByteLength
        expect(header.readUInt32LE(24)).toEqual(0);             // batchTableBinaryByteLength
        expect(b3dmBuffer.length).toEqual(byteLength);
    });

    it('generates a b3dm with feature table and batch table', function() {
        var featureTableJson = {
            BATCH_LENGTH : 10
        };
        var batchTableJson = {
            height : {
                componentType : 'FLOAT',
                type : 'SCALAR',
                byteOffset : 0
            }
        };

        var headerByteLength = 28;
        var featureTableJsonBuffer = getJsonBufferPadded(featureTableJson, headerByteLength);
        var featureTableBinaryBuffer = getBufferPadded(Buffer.alloc(16)); // Contents don't matter
        var batchTableJsonBuffer = getJsonBufferPadded(batchTableJson);
        var batchTableBinaryBuffer = getBufferPadded(Buffer.alloc(32)); // Contents don't matter

        var byteLength = headerByteLength + featureTableJsonBuffer.length + featureTableBinaryBuffer.length + batchTableJsonBuffer.length + batchTableBinaryBuffer.length + glbBuffer.length;

        var b3dmBuffer = glbToB3dm(glbBuffer, featureTableJson, featureTableBinaryBuffer, batchTableJson, batchTableBinaryBuffer);
        var header = b3dmBuffer.slice(0, headerByteLength);
        expect(header.toString('utf8', 0, 4)).toEqual('b3dm');                     // magic
        expect(header.readUInt32LE(4)).toEqual(1);                                 // version
        expect(header.readUInt32LE(8)).toEqual(byteLength);                        // byteLength
        expect(header.readUInt32LE(12)).toEqual(featureTableJsonBuffer.length);    // featureTableJSONByteLength
        expect(header.readUInt32LE(16)).toEqual(featureTableBinaryBuffer.length);  // featureTableBinaryByteLength
        expect(header.readUInt32LE(20)).toEqual(batchTableJsonBuffer.length);      // batchTableJSONByteLength
        expect(header.readUInt32LE(24)).toEqual(batchTableBinaryBuffer.length);    // batchTableBinaryByteLength
        expect(b3dmBuffer.length).toEqual(byteLength);
    });

    it('convert b3dm to glb and back to b3dm', function() {
        var b3dmBuffer = fs.readFileSync(b3dmPath);
        var b3dm = extractB3dm(b3dmBuffer);
        var b3dmOut = glbToB3dm(b3dm.glb, b3dm.featureTable.json, b3dm.featureTable.binary, b3dm.batchTable.json, b3dm.batchTable.binary);
        expect(b3dm).toEqual(extractB3dm(b3dmOut));
        expect(b3dmOut).toEqual(b3dmBuffer);
    });

    it('throws an error if no glbBuffer is provided', function() {
        expect(function() {
            glbToB3dm();
        }).toThrowError('glbBuffer is not defined.');
    });
});
