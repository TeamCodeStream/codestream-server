// these database indexes are in place for the posts module, all fetch queries
// must use one of these 

'use strict';

module.exports = {
	
	// WARNING -- DO NOT CHANGE OR REMOVE THIS INDEX
	// IT IS USED BY THE OUTBOUND EMAIL SERVER, VERBATIM,
	// BUT WITHOUT SIGNIFICANT STRUCTURAL CHANGES TO OUR
	// CODEBASE CANNOT BE DIRECTLY READ FROM THIS FILE
	// BUT NOTE: we may want to eliminate streamId here
	byTeamId: {
		teamId: 1,
		//streamId: 1,
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
