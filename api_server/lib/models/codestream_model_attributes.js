// attributes that apply to all CodeSteam models

'use strict';

module.exports = {
	_id: {
		type: 'id',
		description: 'ID of the model'
	},
	id: {
		type: 'id',
		description: 'ID of the model'
	},
	version: {
		type: 'number',
		required: true,
		default: 1,
		description: 'Incrementing version of the model'
	},
	createdAt: {
		type: 'timestamp',
		required: true,
		description: 'Integer UNIX timestamp representing date/time this model was created'
	},
	deactivated: {
		type: 'boolean',
		required: true,
		default: false,
		description: 'Indicates whether this model has been deactivated (deleted)'
	},
	modifiedAt: {
		type: 'timestamp',
		required: true,
		description: 'Integer UNIX timestamp representing date/time this model was last modified'
	},
	creatorId: {
		type: 'id',
		description: 'ID of the @@#user#user@@ who created the object'
	},
	_forTesting: {
		type: 'boolean',
		serverOnly: true
	}
};
