// these database indexes are in place for the streams module, all fetch queries
// must use one of these 

'use strict';

module.exports = {
	byMemberIds: {
		teamId: 1,
		memberIds: 1,
		sortId: -1
	},
	byName: {
		teamId: 1,
		name: 1,
		sortId: -1
	},
	byFile: {
		teamId: 1,
		repoId: 1,
		file: 1,
		sortId: -1
	},
	byType: {
		teamId: 1,
		type: 1
	}
};
