'use strict';
var fsExtra = require('fs-extra');
var Promise = require('bluebird');
var optimizeGlb = require('../../lib/optimizeGlb');

var glbPath = './specs/data/CesiumTexturedBox/CesiumTexturedBox.glb';

describe('optimizeGlb', function() {
    var buffer;
    beforeAll(function(done) {
        fsExtra.readFile(glbPath)
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

    xit('compresses textures in a glb using the gltf-pipeline', function(done) {
        var compressionOptions = {
            textureCompressionOptions : {
                format: 'dxt1',
                quality: 10
            }
        };

        var promises = [];
        promises.push(optimizeGlb(buffer));
        promises.push(optimizeGlb(buffer, compressionOptions));

        expect(Promise.all(promises)
            .then(function(optimizedGlbs) {
                expect(optimizedGlbs.length).toEqual(2);
                expect(optimizedGlbs[0]).not.toEqual(optimizedGlbs[1]);
            }), done).toResolve();
    });

    it('throws an error if no buffer is provided', function() {
        expect(function() {
            optimizeGlb();
        }).toThrowError();
    });
});
