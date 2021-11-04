// database indexes for code errors

'use strict';

module.exports = {

	byObjectId: {
		objectId: 1,
		objectType: 1
	},

	// WARNING -- DO NOT CHANGE OR REMOVE THIS INDEX
	// IT IS USED BY THE OUTBOUND EMAIL SERVER, VERBATIM,
	// BUT WITHOUT SIGNIFICANT STRUCTURAL CHANGES TO OUR
	// CODEBASE CANNOT BE DIRECTLY READ FROM THIS FILE
	byLastActivityAt: {
		teamId: 1,
		lastActivityAt: -1
	}
};
