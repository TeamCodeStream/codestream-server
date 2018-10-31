// database indexes for items

'use strict';

module.exports = {
	byTeamId: {
		teamId: 1,
		createdAt: -1
	},
	byType: {
		teamId: 1,
		type: 1,
		createdAt: -1
	},
	byFileStreamId: {
		teamId: 1,
		fileStreamId: 1,
		createdAt: -1
	}
};
