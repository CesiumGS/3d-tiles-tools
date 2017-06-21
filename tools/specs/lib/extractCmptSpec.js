'use strict';
var fsExtra = require('fs-extra');
var Promise = require('bluebird');
var extractCmpt = require('../../lib/extractCmpt');

var compositePath = './specs/data/composite.cmpt';
var compositeOfCompositePath = './specs/data/compositeOfComposite.cmpt';

describe('extractCmpt', function() {
    var compositeBuffer;
    var compositeOfCompositeBuffer; //eslint-disable-line no-unused-vars
    beforeAll(function(done) {
        Promise.all([
            fsExtra.readFile(compositePath)
                .then(function(data) {
                    compositeBuffer = data;
                }),
            fsExtra.readFile(compositeOfCompositePath)
                .then(function(data) {
                    compositeOfCompositeBuffer = data;
                })
        ]).then(done);
    });

    it('extracts a b3dm and i3dm from composite buffer', function() {
        var innerTiles = extractCmpt(compositeBuffer);
        var b3dmMagic = innerTiles[0].toString('utf8', 0, 4);
        var i3dmMagic = innerTiles[1].toString('utf8', 0, 4);
        expect(innerTiles.length).toBe(2);
        expect(b3dmMagic).toBe('b3dm');
        expect(i3dmMagic).toBe('i3dm');
    });

    it('extracts a b3dm and i3dm from composite-of-composite buffer', function() {
        var innerTiles = extractCmpt(compositeBuffer);
        var b3dmMagic = innerTiles[0].toString('utf8', 0, 4);
        var i3dmMagic = innerTiles[1].toString('utf8', 0, 4);
        expect(innerTiles.length).toBe(2);
        expect(b3dmMagic).toBe('b3dm');
        expect(i3dmMagic).toBe('i3dm');
    });

    it('throws an error if no buffer is provided', function() {
        expect(function() {
            extractCmpt();
        }).toThrowError();
    });
});
