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

    it('optimizes and compresses a glb using the gltf-pipeline', function(done) {
        var compressionOptions = { aoOptions: undefined,
            binary: false,
            compressTextureCoordinates: false,
            embed: true,
            embedImage: true,
            encodeNormals: false,
            faceNormals: false,
            tangentsBitangents: false,
            stats: false,
            inputPath: 'null',
            kmcOptions: undefined,
            optimizeForCesium: false,
            outputPath: 'null-optimized.gltf',
            preserve: false,
            quantize: false,
            removeNormals: false,
            textureCompressionOptions: [ { quality: 10, format: 'dxt1' } ]
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
