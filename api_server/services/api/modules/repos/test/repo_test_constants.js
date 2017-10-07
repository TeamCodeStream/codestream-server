'use strict';

var Repo_Attributes = require(process.env.CI_API_TOP + '/services/api/modules/repos/repo_attributes');
var Team_Attributes = require(process.env.CI_API_TOP + '/services/api/modules/teams/team_attributes');
var Company_Attributes = require(process.env.CI_API_TOP + '/services/api/modules/companies/company_attributes');
var User_Attributes = require(process.env.CI_API_TOP + '/services/api/modules/users/user_attributes');

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

const EXPECTED_COMPANY_FIELDS = [
	'_id',
	'deactivated',
	'created_at',
	'modified_at',
	'creator_id',
	'name'
];

const EXPECTED_REPO_RESPONSE = {
	repo: EXPECTED_REPO_FIELDS,
	team: EXPECTED_TEAM_FIELDS,
	company: EXPECTED_COMPANY_FIELDS
};

const UNSANITIZED_ATTRIBUTES = Object.keys(Repo_Attributes).filter(attribute => {
	return Repo_Attributes[attribute].server_only;
});

const UNSANITIZED_TEAM_ATTRIBUTES = Object.keys(Team_Attributes).filter(attribute => {
	return Team_Attributes[attribute].server_only;
});

const UNSANITIZED_COMPANY_ATTRIBUTES = Object.keys(Company_Attributes).filter(attribute => {
	return Company_Attributes[attribute].server_only;
});

const UNSANITIZED_USER_ATTRIBUTES = Object.keys(User_Attributes).filter(attribute => {
	return User_Attributes[attribute].server_only;
});

module.exports = {
	EXPECTED_REPO_RESPONSE,
	UNSANITIZED_ATTRIBUTES,
	UNSANITIZED_TEAM_ATTRIBUTES,
	UNSANITIZED_COMPANY_ATTRIBUTES,
	UNSANITIZED_USER_ATTRIBUTES
};
