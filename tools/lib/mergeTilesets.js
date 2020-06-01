'use strict';
var Cesium = require('cesium');
var fsExtra = require('fs-extra');
var path = require('path');
var Promise = require('bluebird');
var readFile = require('./readFile');

var BoundingSphere = Cesium.BoundingSphere;
var Cartesian3 = Cesium.Cartesian3;
var Check = Cesium.Check;
var defaultValue = Cesium.defaultValue;
var defined = Cesium.defined;
var Matrix3 = Cesium.Matrix3;
var Matrix4 = Cesium.Matrix4;
var OrientedBoundingBox = Cesium.OrientedBoundingBox;
var Rectangle = Cesium.Rectangle;

module.exports = mergeTilesets;

/**
 * Merge any number of tilesets together into a single tileset.
 *
 * @param {Object} options Object with the following properties:
 * @param {String[]} options.inputDirectories Tileset directories to merge.
 * @param {String} [options.outputDirectory] Path to the output directory.
 *
 * @returns {Promise} A promise that resolves when the operation completes.
 */
function mergeTilesets(options) {
    options = defaultValue(options, defaultValue.EMPTY_OBJECT);
    var inputDirectories = options.inputDirectories;
    var outputDirectory = options.outputDirectory;

    Check.defined('options.inputDirectories', inputDirectories);
    Check.typeOf.number.greaterThan('option.inputDirectories.length', inputDirectories.length);

    outputDirectory = path.normalize(defaultValue(outputDirectory,
        path.join(path.dirname(inputDirectories[0]), path.basename(inputDirectories[0]) + '-merged')));
    var outputTilesetPath = path.join(outputDirectory, 'tileset.json');

    var length = inputDirectories.length;
    var tilesetPaths = new Array(length);
    for (var i = 0; i < length; ++i) {
        tilesetPaths[i] = path.join(inputDirectories[i], 'tileset.json');
    }

    return Promise.map(tilesetPaths, function(tilesetPath) {
        return readFile(tilesetPath, 'json');
    }).then(function(tilesets) {
        var geometricError = getMergedGeometricError(tilesets);
        var sphere = getMergedSphere(tilesets);
        var children = getChildren(tilesets, tilesetPaths);
        return {
            asset : {
                version : '1.0'
            },
            geometricError : geometricError,
            root : {
                boundingVolume : {
                    sphere : sphere
                },
                refine : 'ADD',
                geometricError : geometricError,
                children : children
            }
        };
    }).then(function(tilesetJson) {
        return Promise.all([
            fsExtra.outputJson(outputTilesetPath, tilesetJson),
            Promise.map(inputDirectories, function(inputDirectory) {
                var tilesetDirectory = path.join(outputDirectory, path.basename(inputDirectory));
                return fsExtra.copy(inputDirectory, tilesetDirectory);
            })
        ]);
    });
}

function getChildren(tilesets, tilesetPaths) {
    var length = tilesets.length;
    var children = new Array(length);
    for (var i = 0; i < length; ++i) {
        var tilesetUrl = path.join(path.basename(path.dirname(tilesetPaths[i])), path.basename(tilesetPaths[i]));
        tilesetUrl = tilesetUrl.replace(/\\/g, '/'); // Use forward slashes in the JSON

        children[i] = tilesets[i].root;
        children[i].content = {
            uri : tilesetUrl
        };
        children[i].boundingVolume = {
            sphere : getBoundingSphere(tilesets[i])
        }
        delete children[i].children;
        delete children[i].transform;
    }
    return children;
}

function getMergedGeometricError(tilesets) {
    var geometricError = 0.0;
    var length = tilesets.length;
    for (var i = 0; i < length; ++i) {
        geometricError = Math.max(geometricError, tilesets[i].geometricError);
    }
    return geometricError;
}

function getBoundingSphere(tileset) {
    var root = tileset.root;
    var transform = defaultValue(root.transform, Matrix4.IDENTITY);
    var boundingVolume = root.boundingVolume;
    var boundingSphere;
    if (defined(boundingVolume.sphere)) {
        boundingSphere = createBoundingSphereFromSphere(boundingVolume.sphere, transform);
    } else if (defined(boundingVolume.region)) {
        boundingSphere = createBoundingSphereFromRegion(boundingVolume.region, transform);
    } else if (defined(boundingVolume.box)) {
        boundingSphere = createBoundingSphereFromBox(boundingVolume.box, transform);
    }
    var center = boundingSphere.center;
    var radius = boundingSphere.radius;
    return [center.x, center.y, center.z, radius];
}

function getMergedSphere(tilesets) {
    var length = tilesets.length;
    var boundingSpheres = new Array(length);
    for (var i = 0; i < length; ++i) {
        boundingSpheres[i] = BoundingSphere.unpack(getBoundingSphere(tilesets[i]));
    }
    var boundingSphere = BoundingSphere.fromBoundingSpheres(boundingSpheres);
    var center = boundingSphere.center;
    var radius = boundingSphere.radius;
    return [center.x, center.y, center.z, radius];
}

function createBoundingSphereFromBox(box, transform) {
    var center = Cartesian3.fromElements(box[0], box[1], box[2]);
    var halfAxes = Matrix3.fromArray(box, 3);

    // Find the transformed center and halfAxes
    center = Matrix4.multiplyByPoint(transform, center, center);
    var rotationScale = Matrix4.getMatrix3(transform, new Matrix3());
    halfAxes = Matrix3.multiply(rotationScale, halfAxes, halfAxes);

    var orientedBoundingBox = new OrientedBoundingBox(center, halfAxes);
    return BoundingSphere.fromOrientedBoundingBox(orientedBoundingBox);
}

function createBoundingSphereFromRegion(region) {
    var rectangle = Rectangle.unpack(region);
    var minimumHeight = region[4];
    var maximumHeight = region[5];

    var orientedBoundingBox = OrientedBoundingBox.fromRectangle(rectangle, minimumHeight, maximumHeight);
    return BoundingSphere.fromOrientedBoundingBox(orientedBoundingBox);
}

function createBoundingSphereFromSphere(sphere, transform) {
    var center = Cartesian3.fromElements(sphere[0], sphere[1], sphere[2]);
    var radius = sphere[3];

    // Find the transformed center and radius
    center = Matrix4.multiplyByPoint(transform, center, center);
    var scale = Matrix4.getScale(transform, new Cartesian3());
    var uniformScale = Cartesian3.maximumComponent(scale);
    radius *= uniformScale;

    return new BoundingSphere(center, radius);
}
