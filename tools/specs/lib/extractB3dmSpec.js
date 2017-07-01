'use strict';
var fs = require('fs');
var extractB3dm = require('../../lib/extractB3dm');

var b3dmPath = './specs/data/batchedWithBatchTableBinary.b3dm';

describe('extractB3dm', function() {
    var b3dmBuffer;
    beforeAll(function() {
        b3dmBuffer = fs.readFileSync(b3dmPath);
    });

    it('extracts a b3dm from buffer', function() {
        var b3dm = extractB3dm(b3dmBuffer);
        expect(b3dm.header.magic).toBe('b3dm');
        expect(b3dm.header.version).toBe(1);
        expect(b3dm.featureTable.json).toBeDefined();
        expect(b3dm.featureTable.json.BATCH_LENGTH).toBe(10);
        expect(b3dm.featureTable.binary.length).toBe(0);
        expect(b3dm.batchTable.json).toBeDefined();
        expect(b3dm.batchTable.json.Height).toBeDefined();
        expect(b3dm.batchTable.binary.length).toBe(256);
        expect(b3dm.glb.length).toBe(14141);
    });

    it('throws an error if no buffer is provided', function() {
        expect(function() {
            extractB3dm();
        }).toThrowError();
    });
});
