'use strict';

const TeamAttributes = require(process.env.CS_API_TOP + '/modules/teams/team_attributes');

const EXPECTED_TEAM_FIELDS = [
	'_id',
	'companyId',
	'name',
	'memberIds',
	'deactivated',
	'createdAt',
	'modifiedAt',
	'creatorId'
];

const UNSANITIZED_ATTRIBUTES = Object.keys(TeamAttributes).filter(attribute => {
	return TeamAttributes[attribute].serverOnly;
});

module.exports = {
	EXPECTED_TEAM_FIELDS,
	UNSANITIZED_ATTRIBUTES
};
