// express js configuration

'use strict';

/* eslint no-console: 0 */

const CfgData = require('./structuredCfgLoader');
const ExpressCfg = {
	port: CfgData.getProperty('apiServer.port'),
	ignoreHttps: CfgData.getProperty('apiServer.ignoreHttps'),
	https: CfgData.getSection('ssl')
};

if (CfgData.getProperty('apiServer.showConfig'))
	console.log('Config[express]:', JSON.stringify(ExpressCfg, undefined, 10));
module.exports = ExpressCfg;
