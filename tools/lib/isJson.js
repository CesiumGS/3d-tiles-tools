'use strict';
var path = require('path');
var Promise = require('bluebird');
var isTile = require('./isTile');
var readFile = require('./readFile');

module.exports = isJson;

/**
 * @private
 */
function isJson(file) {
    if (path.extname(file) === '.json') {
        return Promise.resolve(true);
    }

    return isTile(file)
        .then(function(result) {
            if (result) {
                return false;
            }
        })
        .then(function() {
            return readFile(file, 'json')
                .then(function() {
                    return true;
                })
                .catch(function() {
                    return false;
                });
        });
            // If the file doesn't have an extension try reading it as json
            // Returns false if JSON.parse throws an error
        });
}
