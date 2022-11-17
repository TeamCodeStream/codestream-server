// attributes for company documents/models

'use strict';

module.exports = {
	name: {
		type: 'string',
		maxLength: 256,
		description: 'Name of the company'
	},
	teamIds: {
		type: 'arrayOfIds',
		maxLength: 256,
		description: 'Teams owned by the company'
	},
	plan: {
		type: 'string',
		maxLength: 20,
		description: 'Current payment plan for this team'
	},
	trialStartDate: {
		type: 'timestamp',
		description: 'Date/time this team\'s trial started' 
	},
	trialEndDate: {
		type: 'timestamp',
		description: 'Date/time this team\'s trial will end'
	},
	planStartDate: {
		type: 'timestamp',
		description: 'Date/time this team was converted from trial to a paid plan'
	},
	reportingGroup: {
		type: 'string',
		maxLength: 20
	},
	stripeSessionId: {
		type: 'string',
		maxLength: 100,
		description: 'Stripe session ID for processing payments',
		serverOnly: true
	},
	planPayor: {
		type: 'string',
		maxLength: 100,
		description: 'Person who paid for the plan, either a user ID or an email',
		serverOnly: true
	},
	planAmount: {
		type: 'number',
		description: 'Amount paid when company plan was paid for',
		serverOnly: true
	},
	planFrequency: {
		type: 'string',
		maxLength: 20,
		description: 'The frequency of payments, either Monthly or Annual',
		serverOnly: true
	},
	planPaidSeats: {
		type: 'number',
		description: 'Number of paid seats for this company',
		serverOnly: true
	},
	planCoupon: {
		type: 'string',
		maxLength: 20,
		description: 'Discount coupon applied with payment',
		serverOnly: true
	},
	stripeInfo: {
		type: 'object',
		maxLength: 1000,
		description: 'Info associated with the stripe payment',
		serverOnly: true
	},
	testGroups: {
		type: 'object',
		maxLength: 200,
		description: 'Info indicating random test group assignments'
	},
	everyoneTeamId: {
		type: 'string',
		description: 'ID of the "everyone" team for this company',
	},
	domainJoining: {
		type: 'arrayOfStrings',
		maxLength: 100,
		description: 'Array of domains recognized by this company for which users with those domains in their emails can automatically join'
	},
	codeHostJoining: {
		type: 'arrayOfStrings',
		maxLength: 100,
		description: 'Array of strings indicating ability to join this company based on GitHub/GitLab/Bitbucket affiliation, in the form "host/org", eg. "github.com/acme"'
	},
	isBeingMigratedToCompanyCentric: {
		type: 'boolean',
		description: 'Indicates migration to the "company-centric" paradigm is currently in progress for this company',
		serverOnly: true
	},
	hasBeenMigratedToCompanyCentric: {
		type: 'boolean',
		description: 'Indicates if this company has been migrated to the "company-centric" paradigm',
		serverOnly: true
	},
	nrAccountIds: {
		type: 'arrayOfNumbers',
		maxLength: 5000,
		description: 'Array of New Relic account IDs associated with this company'
	},
	nrOrgIds: {
		type: 'arrayOfStrings',
		maxLength: 1000,
		description: 'Array of New Relic organization IDs associated with this company'
	},
	isNRConnected: {
		type: 'boolean',
		description: 'Indicates this company has at least one user who is connected to New Relic'
	},
	nrOrgId: {
		type: 'string',
		maxLength: 40,
		description: 'New Relic organization ID associated with this company'
	},
	nrOrgInfo: {
		type: 'object',
		description: 'Info associated with the company as returned by New Relic IdP when provisioning the first user',
		serverOnly: true
	},
	codestreamOnly: {
		type: 'boolean',
		description: 'Indicates this is a "CodeStream" only org from the perspective of New Relic IdP, CodeStream admins can administer',
	}
};
