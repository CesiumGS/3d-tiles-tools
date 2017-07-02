'use strict';
var fsExtra = require('fs-extra');
var getMagic = require('../../lib/getMagic');
var makeCompositeTile = require('../../lib/makeCompositeTile');

var b3dmPath = './specs/data/batchedWithBatchTableBinary.b3dm';
var i3dmPath = './specs/data/instancedWithBatchTableBinary.i3dm';

function getPaddedByteLength(byteLength) {
    var boundary = 8;
    var remainder = byteLength % boundary;
    var padding = (remainder === 0) ? 0 : boundary - remainder;
    return byteLength + padding;
}

describe('makeCompositeTile', function() {
    it('makes a composite tile', function() {
        var b3dm = fsExtra.readFileSync(b3dmPath);
        var i3dm = fsExtra.readFileSync(i3dmPath);

        var b3dmOriginalLength = b3dm.length;
        var i3dmOriginalLength = i3dm.length;
        expect(b3dmOriginalLength % 8 > 0).toBe(true); // initially not aligned

        var cmpt = makeCompositeTile([b3dm, i3dm]);
        var magic = getMagic(cmpt);
        var version = cmpt.readUInt32LE(4);
        var byteLength = cmpt.readUInt32LE(8);
        var tilesLength = cmpt.readUInt32LE(12);

        var headerByteLength = 16;
        var expectedByteLength = headerByteLength + getPaddedByteLength(b3dmOriginalLength) + getPaddedByteLength(i3dmOriginalLength);

        expect(magic).toBe('cmpt');
        expect(version).toBe(1);
        expect(byteLength).toBe(cmpt.length);
        expect(byteLength).toBe(expectedByteLength);
        expect(tilesLength).toBe(2);

        var b3dmMagic = getMagic(cmpt, headerByteLength);
        var b3dmByteLength = cmpt.readUInt32LE(headerByteLength + 8);
        expect(b3dmMagic).toBe('b3dm');
        expect(b3dmByteLength % 8 === 0).toBe(true); // b3dm is aligned

        var i3dmMagic = getMagic(cmpt, headerByteLength + b3dmByteLength);
        var i3dmByteLength = cmpt.readUInt32LE(headerByteLength + b3dmByteLength + 8);
        expect(i3dmMagic).toBe('i3dm');
        expect(i3dmByteLength % 8 === 0).toBe(true); // i3dm is aligned
    });
});
