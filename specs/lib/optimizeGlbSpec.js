'use strict';
const fsExtra = require('fs-extra');
const Promise = require('bluebird');
const optimizeGlb = require('../../lib/optimizeGlb');

const glbPath = './specs/data/CesiumTexturedBox/CesiumTexturedBox.glb';

describe('optimizeGlb', function() {
    let buffer;
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
        const compressionOptions = {
            textureCompressionOptions : {
                format: 'dxt1',
                quality: 10
            }
        };

        const promises = [];
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
