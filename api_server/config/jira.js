// asana integration configuration

'use strict';

/* eslint no-console: 0 */

const CfgData = require('./structuredCfgLoader');
const JiraProviders = CfgData.getSection('integrations.jira');
const JiraCfg = JiraProviders.cloud;
Object.keys(JiraProviders).forEach(provider => {
	if (provider != 'cloud') {
		JiraCfg.localProviders[provider] = JiraProviders[provider];
	}
});

if (CfgData.getProperty('apiServer.showConfig'))
	console.log('Config[jira]:', JSON.stringify(JiraCfg, undefined, 10));
module.exports = JiraCfg;
