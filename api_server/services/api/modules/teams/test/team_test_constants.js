'use strict';

const Team_Attributes = require(process.env.CS_API_TOP + '/services/api/modules/teams/team_attributes');

const EXPECTED_TEAM_FIELDS = [
	'_id',
	'company_id',
	'name',
	'member_ids',
	'deactivated',
	'created_at',
	'modified_at',
	'creator_id'
];

const UNSANITIZED_ATTRIBUTES = Object.keys(Team_Attributes).filter(attribute => {
	return Team_Attributes[attribute].server_only;
});

module.exports = {
	EXPECTED_TEAM_FIELDS,
	UNSANITIZED_ATTRIBUTES
};
