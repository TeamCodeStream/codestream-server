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
	}
};
