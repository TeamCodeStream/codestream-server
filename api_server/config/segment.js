// segment (analytics) configuration

'use strict';

/* eslint no-console: 0 */

const CfgData = require('./structuredCfgLoader');
const SegmentCfg = CfgData.getSection('telemetry.segment');

if (CfgData.getProperty('apiServer.showConfig'))
	console.log('Config[segment]:', JSON.stringify(SegmentCfg, undefined, 10));
module.exports = SegmentCfg;
