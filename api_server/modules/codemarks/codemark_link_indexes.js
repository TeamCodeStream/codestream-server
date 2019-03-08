// database indexes for codemark links

'use strict';

module.exports = {
	byTeamId: {
		teamId: 1,
		_id: 1
	},
	byHash: {
		teamId: 1,
		md5Hash: 1
	}
};
