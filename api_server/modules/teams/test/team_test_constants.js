// test constants for testing the teams module

'use strict';

const TeamAttributes = require(process.env.CS_API_TOP + '/modules/teams/team_attributes');
const CompanyAttributes = require(process.env.CS_API_TOP + '/modules/companies/company_attributes');
const StreamAttributes = require(process.env.CS_API_TOP + '/modules/streams/stream_attributes');

// fields expected in all teams
const EXPECTED_TEAM_FIELDS = [
	'id',
	'companyId',
	'name',
	'memberIds',
	'deactivated',
	'createdAt',
	'modifiedAt',
	'creatorId',
	'primaryReferral',
	'providerHosts'
];

// fields expected in the company returned
const EXPECTED_COMPANY_FIELDS = [
	'id',
	'deactivated',
	'createdAt',
	'modifiedAt',
	'creatorId',
	'name'
];

const EXPECTED_TEAM_RESPONSE = {
	team: EXPECTED_TEAM_FIELDS,
	company: EXPECTED_COMPANY_FIELDS
};

const UNSANITIZED_COMPANY_ATTRIBUTES = Object.keys(CompanyAttributes).filter(attribute => {
	return CompanyAttributes[attribute].serverOnly;
});

const UNSANITIZED_STREAM_ATTRIBUTES = Object.keys(StreamAttributes).filter(attribute => {
	return StreamAttributes[attribute].serverOnly;
});

const UNSANITIZED_ATTRIBUTES = Object.keys(TeamAttributes).filter(attribute => {
	return attribute !== 'providerHosts' && TeamAttributes[attribute].serverOnly;
});

const STANDARD_PROVIDER_HOSTS = { 
	'app*asana*com': {
		id: 'app*asana*com',
		name: 'asana',
		isEnterprise: false,
		host: 'app.asana.com',
		apiHost: 'app.asana.com',
		hasIssues: true 
	},
	'bitbucket*org': {
		id: 'bitbucket*org',
		name: 'bitbucket',
		isEnterprise: false,
		host: 'bitbucket.org',
		apiHost: 'api.bitbucket.org/2.0',
		hasIssues: true
	},
	'github*com': {
		id: 'github*com',
		name: 'github',
		isEnterprise: false,
		host: 'github.com',
		apiHost: 'api.github.com',
		hasIssues: true
	},
	'gitlab*com': {
		id: 'gitlab*com',
		name: 'gitlab',
		isEnterprise: false,
		host: 'gitlab.com',
		apiHost: 'gitlab.com/api/v4',
		hasIssues: true 
	},
	'auth*atlassian*com': {
		id: 'auth*atlassian*com',
		name: 'jira',
		isEnterprise: false,
		host: 'auth.atlassian.com',
		apiHost: 'api.atlassian.com',
		hasIssues: true
	},
	'trello*com': {
		id: 'trello*com',
		name: 'trello',
		isEnterprise: false,
		host: 'trello.com',
		apiHost: 'api.trello.com/1',
		hasIssues: true
	},
	'youtrack*com': {
		id: 'youtrack*com',
		name: 'youtrack',
		isEnterprise: false,
		needsConfigure: true,
		host: 'youtrack.com',
		hasIssues: true
	},
	'app*vssps*visualstudio*com': {
		id: 'app*vssps*visualstudio*com',
		name: 'azuredevops',
		isEnterprise: false,
		needsConfigure: true,
		host: 'app.vssps.visualstudio.com',
		apiHost: 'dev.azure.com',
		hasIssues: true
	},
	'slack*com': {
		id: 'slack*com',
		name: 'slack',
		isEnterprise: false,
		host: 'slack.com',
		apiHost: 'slack.com/api' 
	}
};

module.exports = {
	EXPECTED_TEAM_RESPONSE,
	UNSANITIZED_ATTRIBUTES,
	UNSANITIZED_COMPANY_ATTRIBUTES,
	UNSANITIZED_STREAM_ATTRIBUTES,
	STANDARD_PROVIDER_HOSTS
};
