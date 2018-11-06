// these database indexes are in place for the posts module, all fetch queries
// must use one of these 

'use strict';

module.exports = {
	byId: {
		teamId: 1,
		streamId: 1,
		_id: -1
	},
	byParentPostId: {
		teamId: 1,
		streamId: 1,
		parentPostId: 1,
		seqNum: -1
	},
	bySeqNum: {
		teamId: 1,
		streamId: 1,
		seqNum: 1
	}
};
