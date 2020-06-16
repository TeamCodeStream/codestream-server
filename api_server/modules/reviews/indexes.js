// database indexes for codemarks

'use strict';

module.exports = {
	byTeamId: {
		teamId: 1,
		createdAt: -1
	},
	byStreamId: {
		teamId: 1,
		streamId: 1,
		createdAt: -1
	},
	byLastActivityAt: {
		teamId: 1,
		lastActivityAt: -1
	}
};
