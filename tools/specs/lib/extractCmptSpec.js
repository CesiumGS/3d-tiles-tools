'use strict';
var fs = require('fs');
var Promise = require('bluebird');
var extractCmpt = require('../../lib/extractCmpt');

var fsReadFile = Promise.promisify(fs.readFile);

var compositePath = './specs/data/composite.cmpt';
var compositeOfCompositePath = './specs/data/compositeOfComposite.cmpt';

describe('extractCmpt', function() {
    var compositeBuffer;
    var compositeOfCompositeBuffer;
    beforeAll(function(done) {
        Promise.all([
            fsReadFile(compositePath)
                .then(function(data) {
                    compositeBuffer = data;
                }),
            fsReadFile(compositeOfCompositePath)
                .then(function(data) {
                    compositeOfCompositeBuffer = data;
                })
        ]).then(done);
    });

    it('extracts a b3dm and i3dm from composite buffer', function() {
        var innerTiles = extractCmpt(compositeBuffer);
        expect(innerTiles.length).toBe(2);
        expect(innerTiles[0].header.magic).toBe('b3dm');
        expect(innerTiles[0].glb.length).toBe(9973);
        expect(innerTiles[1].header.magic).toBe('i3dm');
        expect(innerTiles[1].glb.length).toBe(5337);
    });

    it('extracts a b3dm and i3dm from composite-of-composite buffer', function() {
        var innerTiles = extractCmpt(compositeOfCompositeBuffer);
        expect(innerTiles.length).toBe(2);
        expect(innerTiles[0].header.magic).toBe('b3dm');
        expect(innerTiles[0].glb.length).toBe(9973);
        expect(innerTiles[1].header.magic).toBe('i3dm');
        expect(innerTiles[1].glb.length).toBe(5337);
    });

    it('throws an error if no buffer is provided', function() {
        expect(function() {
            extractCmpt();
        }).toThrowError();
    });
});
