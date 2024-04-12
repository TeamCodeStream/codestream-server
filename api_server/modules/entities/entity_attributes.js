// attributes for entity documents/models

'use strict';

module.exports = {
	companyId: {
		type: 'id',
		required: true,
		description: 'ID of the @@#company#company@@ with which the repo is associated'
	},
	teamId: {
		type: 'id',
		required: true,
		description: 'ID of the @@#team#team@@ with which the repo is associated'
	},
	entityId: {
		type: 'string',
		required: true,
		maxLength: 128,
		description: 'Entity GUID of the entity'
	},
	lastUpdated: {
		type: 'timestamp',
		required: true,
		description: 'Last time the entity was viewed in CodeStream'
	},
	lastUserId: {
		type: 'id',
		required: true,
		description: 'ID of the last user to view the entity in CodeStream'
	}
};
