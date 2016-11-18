'use strict';
var fs = require('fs');
var Promise = require('bluebird');
var optimizeGlb = require('../../lib/optimizeGlb');

var fsReadFile = Promise.promisify(fs.readFile);

var glbPath = './specs/data/CesiumTexturedBox/CesiumTexturedBox.glb';

describe('optimizeGlb', function() {
    var buffer;
    beforeAll(function(done) {
        fsReadFile(glbPath)
            .then(function(data) {
                buffer = data;
                done();
            });
    });

    it('optimizes a glb using the gltf-pipeline', function(done) {
        expect(optimizeGlb(buffer)
            .then(function(optimizedGlb) {
                expect(optimizedGlb).not.toEqual(buffer);
            }), done).toResolve();
    });

    it('throws an error if no buffer is provided', function() {
        expect(function() {
            optimizeGlb();
        }).toThrowError();
    });
});
