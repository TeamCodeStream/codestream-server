// test constants for testing the entities module

'use strict';

const EntityAttributes = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/entities/entity_attributes');

// fields expected in all entities
const EXPECTED_ENTITY_FIELDS = [
	'id',
	'deactivated',
	'createdAt',
	'modifiedAt',
	'creatorId',
	'companyId',
	'teamId',
	'entityId',
	'lastUserId',
	'lastUpdated'
];

const EXPECTED_ENTITY_RESPONSE = {
	repo: EXPECTED_ENTITY_FIELDS
};

const UNSANITIZED_ATTRIBUTES = Object.keys(EntityAttributes).filter(attribute => {
	return EntityAttributes[attribute].serverOnly;
});

module.exports = {
	EXPECTED_ENTITY_RESPONSE,
	UNSANITIZED_ATTRIBUTES
};
