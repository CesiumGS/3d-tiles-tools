/*eslint-disable global-require*/
'use strict';
module.exports = {
    combineTileset: require('./lib/combineTileset'),
    createB3dm: require('./lib/createB3dm'),
    createCmpt: require('./lib/createCmpt'),
    createI3dm: require('./lib/createI3dm'),
    createPnts: require('./lib/createPnts'),
    databaseToTileset: require('./lib/databaseToTileset'),
    extractB3dm: require('./lib/extractB3dm'),
    extractCmpt: require('./lib/extractCmpt'),
    extractI3dm: require('./lib/extractI3dm'),
    extractPnts: require('./lib/extractPnts'),
    gzipTileset: require('./lib/gzipTileset'),
    runPipeline: require('./lib/runPipeline'),
    tilesetToDatabase: require('./lib/tilesetToDatabase'),
    upgradeTileset: require('./lib/upgradeTileset')
};
