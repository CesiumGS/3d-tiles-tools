'use strict';
var fs = require('fs');
var Promise = require('bluebird');
var extractI3dm = require('../../lib/extractI3dm');

var fsReadFile = Promise.promisify(fs.readFile);

var i3dmPath = './specs/data/instancedTile.i3dm';

describe('extractI3dm', function() {
    var buffer;
    beforeAll(function(done) {
        fsReadFile(i3dmPath)
            .then(function(data) {
                buffer = data;
                done();
            });
    });

    it('extracts a i3dm from buffer', function() {
        var i3dm = extractI3dm(buffer);
        expect(i3dm.header.magic).toBe('i3dm');
        expect(i3dm.header.version).toBe(1);
        expect(i3dm.featureTable.json.length).toBe(104);
        expect(i3dm.featureTable.binary.length).toBe(352);
        expect(i3dm.batchTable.json.length).toBe(87);
        expect(i3dm.batchTable.binary.length).toBe(0);
        expect(i3dm.glb.length).toBe(5336);
    });

    it('throws an error if no buffer is provided', function() {
        expect(function() {
            extractI3dm();
        }).toThrowError();
    });
});
