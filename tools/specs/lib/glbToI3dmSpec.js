'use strict';
const fs = require('fs');
const extractI3dm = require('../../lib/extractI3dm');
const getBufferPadded = require('../../lib/getBufferPadded');
const getJsonBufferPadded = require('../../lib/getJsonBufferPadded');
const glbToI3dm = require('../../lib/glbToI3dm');

const glbPath = './specs/data/CesiumTexturedBox/CesiumTexturedBox.glb';
const i3dmPath = './specs/data/instancedWithBatchTableBinary.i3dm';

describe('glbToI3dm', function() {
    let glbBuffer;

    beforeAll(function() {
        glbBuffer = fs.readFileSync(glbPath);
    });

    it('generates a basic i3dm header for a glb', function() {
        const headerByteLength = 32;
        const byteLength = headerByteLength + glbBuffer.length;
        const i3dmBuffer = glbToI3dm(glbBuffer);
        const header = i3dmBuffer.slice(0, headerByteLength);
        expect(header.toString('utf8', 0, 4)).toEqual('i3dm');  // magic
        expect(header.readUInt32LE(4)).toEqual(1);              // version
        expect(header.readUInt32LE(8)).toEqual(byteLength);     // byteLength
        expect(header.readUInt32LE(12)).toEqual(0);             // featureTableJSONByteLength
        expect(header.readUInt32LE(16)).toEqual(0);             // featureTableBinaryByteLength
        expect(header.readUInt32LE(20)).toEqual(0);             // batchTableJSONByteLength
        expect(header.readUInt32LE(24)).toEqual(0);             // batchTableBinaryByteLength
        expect(header.readUInt32LE(28)).toEqual(1);             // gltfFormat
        expect(i3dmBuffer.length).toEqual(byteLength);
    });

    it('generates an i3dm with feature table and batch table', function() {
        const featureTableJson = {
            INSTANCES_LENGTH : 1,
            POSITION : {
                byteOffset : 0
            }
        };
        const batchTableJson = {
            height : {
                componentType : 'FLOAT',
                type : 'SCALAR',
                byteOffset : 0
            }
        };

        const featureTableJsonBuffer = getJsonBufferPadded(featureTableJson);
        const featureTableBinaryBuffer = getBufferPadded(Buffer.alloc(16)); // Contents don't matter
        const batchTableJsonBuffer = getJsonBufferPadded(batchTableJson);
        const batchTableBinaryBuffer = getBufferPadded(Buffer.alloc(32)); // Contents don't matter

        const headerByteLength = 32;
        const byteLength = headerByteLength + featureTableJsonBuffer.length + featureTableBinaryBuffer.length + batchTableJsonBuffer.length + batchTableBinaryBuffer.length + glbBuffer.length;

        const i3dmBuffer = glbToI3dm(glbBuffer, featureTableJson, featureTableBinaryBuffer, batchTableJson, batchTableBinaryBuffer);
        const header = i3dmBuffer.slice(0, headerByteLength);
        expect(header.toString('utf8', 0, 4)).toEqual('i3dm');                      // magic
        expect(header.readUInt32LE(4)).toEqual(1);                                  // version
        expect(header.readUInt32LE(8)).toEqual(byteLength);                         // byteLength
        expect(header.readUInt32LE(12)).toEqual(featureTableJsonBuffer.length);     // featureTableJSONByteLength
        expect(header.readUInt32LE(16)).toEqual(featureTableBinaryBuffer.length);   // featureTableBinaryByteLength
        expect(header.readUInt32LE(20)).toEqual(batchTableJsonBuffer.length);       // batchTableJSONByteLength
        expect(header.readUInt32LE(24)).toEqual(batchTableBinaryBuffer.length);     // batchTableBinaryByteLength
        expect(header.readUInt32LE(28)).toEqual(1);                                 // gltfFormat
        expect(i3dmBuffer.length).toEqual(byteLength);
    });

    it('convert i3dm to glb and back to i3dm', function() {
        const i3dmBuffer = fs.readFileSync(i3dmPath);
        const i3dm = extractI3dm(i3dmBuffer);
        const i3dmOut = glbToI3dm(i3dm.glb, i3dm.featureTable.json, i3dm.featureTable.binary, i3dm.batchTable.json, i3dm.batchTable.binary);
        expect(i3dm).toEqual(extractI3dm(i3dmOut));
        expect(i3dmOut).toEqual(i3dmBuffer);
    });

    it('throws an error if no glbBuffer is provided', function() {
        expect(function() {
            glbToI3dm();
        }).toThrowError('glbBuffer is not defined.');
    });
});
