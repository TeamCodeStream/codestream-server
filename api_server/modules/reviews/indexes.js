// database indexes for codemarks

'use strict';

module.exports = {
	byTeamId: {
		teamId: 1,
		createdAt: -1
	},
	/*
	byStreamId: {
		teamId: 1,
		streamId: 1,
		createdAt: -1
	},
	*/
	
	// WARNING -- DO NOT CHANGE OR REMOVE THIS INDEX
	// IT IS USED BY THE OUTBOUND EMAIL SERVER, VERBATIM,
	// BUT WITHOUT SIGNIFICANT STRUCTURAL CHANGES TO OUR
	// CODEBASE CANNOT BE DIRECTLY READ FROM THIS FILE
	byLastActivityAt: {
		teamId: 1,
		lastActivityAt: -1
},

	byStatus: {
		status: 1,
		lastReminderSentAt: 1,
		lastActivityAt: -1
	}
};
