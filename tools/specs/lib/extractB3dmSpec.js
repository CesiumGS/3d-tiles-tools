'use strict';
var fs = require('fs');
var Promise = require('bluebird');
var extractB3dm = require('../../lib/extractB3dm');

var fsReadFile = Promise.promisify(fs.readFile);

var b3dmPath = './specs/data/batchedWithBatchTableBinary.b3dm';

describe('extractB3dm', function() {
    var buffer;
    beforeAll(function(done) {
        fsReadFile(b3dmPath)
            .then(function(data) {
                buffer = data;
                done();
            });
    });

    it('extracts a b3dm from buffer', function() {
        var b3dm = extractB3dm(buffer);
        expect(b3dm.header.magic).toBe('b3dm');
        expect(b3dm.header.version).toBe(1);
        expect(b3dm.header.batchLength).toBe(10);
        expect(b3dm.batchTable.json.length).toBe(760);
        expect(b3dm.batchTable.binary.length).toBe(256);
        expect(b3dm.glb.length).toBe(14466);
    });

    it('throws an error if no buffer is provided', function() {
        expect(function() {
            extractB3dm();
        }).toThrowError();
    });
});
