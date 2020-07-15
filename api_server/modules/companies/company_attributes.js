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
	stripeInfo: {
		type: 'object',
		maxLength: 1000,
		description: 'Info associated with the stripe payment',
		serverOnly: true
	}
};
