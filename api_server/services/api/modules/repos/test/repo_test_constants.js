'use strict';

var Repo_Attributes = require(process.env.CI_API_TOP + '/services/api/modules/repos/repo_attributes');

const EXPECTED_REPO_FIELDS = [
	'_id',
	'deactivated',
	'created_at',
	'modified_at',
	'creator_id',
	'company_id',
	'team_id',
	'url',
	'first_commit_sha'
];

const EXPECTED_TEAM_FIELDS = [
	'_id',
	'deactivated',
	'created_at',
	'modified_at',
	'creator_id',
	'company_id',
	'name',
	'member_ids'
];

const EXPECTED_REPO_RESPONSE = {
	repo: EXPECTED_REPO_FIELDS,
	team: EXPECTED_TEAM_FIELDS
};

const UNSANITIZED_ATTRIBUTES = Object.keys(Repo_Attributes).filter(attribute => {
	return Repo_Attributes[attribute].server_only;
});

module.exports = {
	EXPECTED_REPO_RESPONSE,
	UNSANITIZED_ATTRIBUTES
};
