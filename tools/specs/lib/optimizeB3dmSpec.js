'use strict';
var fs = require('fs');
var Promise = require('bluebird');
var optimizeB3dm = require('../../lib/optimizeB3dm');

var fsReadFile = Promise.promisify(fs.readFile);

var b3dmPath = './specs/data/batchedWithBatchTableBinary.b3dm';

describe('optimizeB3dm', function() {
    var buffer;
    beforeAll(function(done) {
        fsReadFile(b3dmPath)
            .then(function(data) {
                buffer = data;
                done();
            });
    });

    it('optimizes a b3dm using the gltf-pipeline', function(done) {
        var batchTableJSONByteLength = buffer.readUInt32LE(12);
        var batchTableBinaryByteLength = buffer.readUInt32LE(16);
        var batchLength = buffer.readUInt32LE(20);
        expect(optimizeB3dm(buffer)
            .then(function(optimizedBuffer) {
                var header = optimizedBuffer.slice(0, 24);
                expect(header.toString('utf8', 0, 4)).toEqual('b3dm');
                expect(header.readUInt32LE(4)).toEqual(1);
                expect(header.readUInt32LE(8)).toEqual(optimizedBuffer.length);
                expect(header.readUInt32LE(12)).toEqual(batchTableJSONByteLength);
                expect(header.readUInt32LE(16)).toEqual(batchTableBinaryByteLength);
                expect(header.readUInt32LE(20)).toEqual(batchLength);
            }), done).toResolve();
    });

    it('throws an error if no buffer is provided', function() {
        expect(function() {
            optimizeB3dm()
        }).toThrowError();
    });
});
