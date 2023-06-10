// attributes for stream documents/models

'use strict';

module.exports = {
	companyId: {
		type: 'id',
		required: true,
		description: 'ID of the @@#company#company@@ to which this team belongs'
	},
	name: {
		type: 'string',
		maxLength: 64,
		description: 'Name of the team'
	},
	memberIds: {
		type: 'arrayOfIds',
		maxLength: 256,
		required: true,
		description: 'Array of @@#user#user@@ IDs representing the members of the team'
	},
	removedMemberIds: {
		type: 'arrayOfIds',
		maxLength: 256,
		description: 'Array of @@#user#user@@ IDs representing users who have been removed from the team (but their content is still visible and accessible to other members)'
	},
	foreignMemberIds: {
		type: 'arrayOfIds',
		maxLength: 256,
		description: 'Array of @@#user#user@@ IDs representing users who are not members of the team but who may have contributed content which is still visible and accessible to other members'
	},
	integrations: {
		type: 'object',
		description: 'An object whose keys are possible integrations ("slack", "msteams", etc.); one attribute of the object is "enabled", defining whether the integration is currently enabled. Other attributes in the value are integration-dependent.'
	},
	primaryReferral: {
		type: 'string',
		maxLength: 12,
		ignoreDescribe: true
	},
	adminIds: {
		type: 'arrayOfIds',
		maxLength: 256,
		description: 'IDs of the administrators for this team'
	},
	settings: {
		type: 'object',
		maxLength: 10000,
		description: 'Free-form object representing the team\'s settings'
	},
	providerInfo: {
		type: 'object',
		description: 'Object containing credentials info for third-party providers'
	},
	providerIdentities: {
		type: 'arrayOfStrings',
		serverOnly: true
	},
	serverProviderData: {
		type: 'object',
		description: 'Object containing metadata for server-only third-party provider tokens'
	},
	serverProviderToken: {
		type: 'object',
		description: 'Object containing server-only access tokens for third-party providers',
		serverOnly: true
	},
	reportingGroup: { // deprecated, now in company object
		type: 'string',
		maxLength: 20
	},
	providerHosts: {
		type: 'object',
		maxLength: 10000,
		serverOnly: true
	},
	plan: { // deprecated, now in company object
		type: 'string',
		maxLength: 20,
		description: 'Current payment plan for this team'
	},
	trialStartDate: { // deprecated, now in company object
		type: 'timestamp',
		description: 'Date/time this team\'s trial started' 
	},
	trialEndDate: { // deprecated, now in company object
		type: 'timestamp',
		description: 'Date/time this team\'s trial will end'
	},
	planStartDate: { // deprecated, now in company object
		type: 'timestamp',
		description: 'Date/time this team was converted from trial to a paid plan'
	},
	tags: {
		type: 'object',
		maxLength: 5000,
		description: 'Hash of tags available to the members of this team, the hask keys are IDs, and the object color and label'
	},
	lastPostCreatedAt: {
		type: 'timestamp',
		description: 'Date/time the last post was created for this team',
		serverOnly: true
	},
	lastWeeklyEmailRunAt: {
		type: 'timestamp',
		description: 'Date/time of the last time a weekly email run was done for this team',
		serverOnly: true
	},
	weeklyEmailRunCount: {
		type: 'number',
		description: 'How many attempts at a weekly email run for this team should be continued if no weekly activity',
		serverOnly: true
	},
	isEveryoneTeam: {
		type: 'boolean',
		description: 'For company-centric paradigm, indicates that this is the one and only team for the company'
	},
	grokUserId: {
		type: 'id',
		description: 'The ID of the Grok user that is applicable only to this team',
	}
};
