#!/usr/bin/env node

const structuredCfgFile = require('../lib/load_config');
const testCfg = new structuredCfgFile({
	schemaFile: '/Users/jj/src/codestream-configs/parameters.json',
	configFile: 'testcfg.json'
});
// testCfg.dump();
let o;

o = testCfg.getSection('ssl');
// o = testCfg.getSection('broadcastEngine.codestreamBroadcaster');
// o = testCfg.getSection();

console.log(o);
process.exit();
