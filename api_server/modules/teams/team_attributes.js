// attributes for stream documents/models

'use strict';

module.exports = {
	companyId: {
		type: 'id',
		required: true,
		description: 'ID of the @@#company#company@@ to which this team belongs'
	},
	name: {
		type: 'string',
		maxLength: 64,
		description: 'Name of the team'
	},
	memberIds: {
		type: 'arrayOfIds',
		maxLength: 256,
		required: true,
		description: 'Array of @@#user#user@@ IDs representing the members of the team'
	},
	integrations: {
		type: 'object',
		description: 'An object whose keys are possible integrations ("slack", "msteams", etc.); one attribute of the object is "enabled", defining whether the integration is currently enabled. Other attributes in the value are integration-dependent.'
	},
	primaryReferral: {
		type: 'string',
		maxLength: 12,
		ignoreDescribe: true
	}
};
