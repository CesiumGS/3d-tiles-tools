'use strict';
const fsExtra = require('fs-extra');
const getMagic = require('../../lib/getMagic');
const makeCompositeTile = require('../../lib/makeCompositeTile');

const b3dmPath = './specs/data/batchedWithBatchTableBinary.b3dm';
const i3dmPath = './specs/data/instancedWithBatchTableBinary.i3dm';

function getPaddedByteLength(byteLength) {
    const boundary = 8;
    const remainder = byteLength % boundary;
    const padding = (remainder === 0) ? 0 : boundary - remainder;
    return byteLength + padding;
}

describe('makeCompositeTile', function() {
    it('makes a composite tile', function() {
        const b3dm = fsExtra.readFileSync(b3dmPath);
        const i3dm = fsExtra.readFileSync(i3dmPath);

        const b3dmOriginalLength = b3dm.length;
        const i3dmOriginalLength = i3dm.length;
        expect(b3dmOriginalLength % 8 > 0).toBe(true); // initially not aligned

        const cmpt = makeCompositeTile([b3dm, i3dm]);
        const magic = getMagic(cmpt);
        const version = cmpt.readUInt32LE(4);
        const byteLength = cmpt.readUInt32LE(8);
        const tilesLength = cmpt.readUInt32LE(12);

        const headerByteLength = 16;
        const expectedByteLength = headerByteLength + getPaddedByteLength(b3dmOriginalLength) + getPaddedByteLength(i3dmOriginalLength);

        expect(magic).toBe('cmpt');
        expect(version).toBe(1);
        expect(byteLength).toBe(cmpt.length);
        expect(byteLength).toBe(expectedByteLength);
        expect(tilesLength).toBe(2);

        const b3dmMagic = getMagic(cmpt, headerByteLength);
        const b3dmByteLength = cmpt.readUInt32LE(headerByteLength + 8);
        expect(b3dmMagic).toBe('b3dm');
        expect(b3dmByteLength % 8 === 0).toBe(true); // b3dm is aligned

        const i3dmMagic = getMagic(cmpt, headerByteLength + b3dmByteLength);
        const i3dmByteLength = cmpt.readUInt32LE(headerByteLength + b3dmByteLength + 8);
        expect(i3dmMagic).toBe('i3dm');
        expect(i3dmByteLength % 8 === 0).toBe(true); // i3dm is aligned
    });
});
