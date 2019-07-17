#!/usr/bin/env node

const util = require('util')
const structuredCfgFile = require('../lib/structured_config');
const testCfg = new structuredCfgFile({
	schemaFile: '/Users/jj/src/codestream-configs/parameters.json',
	configFile: 'testcfg.json'
});
// testCfg.dump();
let o;

o = testCfg.getSection();
// o = testCfg.getSection('broadcastEngine.codestreamBroadcaster');
// o = testCfg.getSection();
console.log(util.inspect(o, false, null, true /* enable colors */))
process.exit();
