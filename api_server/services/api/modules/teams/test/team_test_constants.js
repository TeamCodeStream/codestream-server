'use strict';

const EXPECTED_TEAM_FIELDS = [
	'_id',
	'member_ids',
	'org_id'
];

const EXPECTED_NAMED_TEAM_FIELDS = [...EXPECTED_TEAM_FIELDS, 'name'];

module.exports = {
	EXPECTED_TEAM_FIELDS,
	EXPECTED_NAMED_TEAM_FIELDS
};

