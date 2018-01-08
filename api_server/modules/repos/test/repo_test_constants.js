'use strict';

const RepoAttributes = require(process.env.CS_API_TOP + '/modules/repos/repo_attributes');
const TeamAttributes = require(process.env.CS_API_TOP + '/modules/teams/team_attributes');
const CompanyAttributes = require(process.env.CS_API_TOP + '/modules/companies/company_attributes');
const UserAttributes = require(process.env.CS_API_TOP + '/modules/users/user_attributes');

const EXPECTED_REPO_FIELDS = [
	'_id',
	'deactivated',
	'createdAt',
	'modifiedAt',
	'creatorId',
	'companyId',
	'teamId',
	'url',
	'normalizedUrl',
	'firstCommitHash'
];

const EXPECTED_TEAM_FIELDS = [
	'_id',
	'deactivated',
	'createdAt',
	'modifiedAt',
	'creatorId',
	'companyId',
	'name',
	'memberIds'
];

const EXPECTED_COMPANY_FIELDS = [
	'_id',
	'deactivated',
	'createdAt',
	'modifiedAt',
	'creatorId',
	'name'
];

const EXPECTED_REPO_RESPONSE = {
	repo: EXPECTED_REPO_FIELDS,
	team: EXPECTED_TEAM_FIELDS,
	company: EXPECTED_COMPANY_FIELDS
};

const UNSANITIZED_ATTRIBUTES = Object.keys(RepoAttributes).filter(attribute => {
	return RepoAttributes[attribute].serverOnly;
});

const UNSANITIZED_TEAM_ATTRIBUTES = Object.keys(TeamAttributes).filter(attribute => {
	return TeamAttributes[attribute].serverOnly;
});

const UNSANITIZED_COMPANY_ATTRIBUTES = Object.keys(CompanyAttributes).filter(attribute => {
	return CompanyAttributes[attribute].serverOnly;
});

const UNSANITIZED_USER_ATTRIBUTES = Object.keys(UserAttributes).filter(attribute => {
	return UserAttributes[attribute].serverOnly;
});

module.exports = {
	EXPECTED_REPO_RESPONSE,
	UNSANITIZED_ATTRIBUTES,
	UNSANITIZED_TEAM_ATTRIBUTES,
	UNSANITIZED_COMPANY_ATTRIBUTES,
	UNSANITIZED_USER_ATTRIBUTES
};
