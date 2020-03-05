// Azure DevOps integration configuration

'use strict';

/* eslint no-console: 0 */

const CfgData = require('./structuredCfgLoader');
const DevOpsCfg = CfgData.getSection('integrations.devops.cloud') || {appClientId: null, appClientSecret: null};

if (CfgData.getProperty('apiServer.showConfig'))
	console.log('Config[azuredevops]:', JSON.stringify(DevOpsCfg, undefined, 10));
module.exports = DevOpsCfg;
