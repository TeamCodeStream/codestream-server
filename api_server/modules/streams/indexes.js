// these database indexes are in place for the streams module, all fetch queries
// must use one of these 

'use strict';

module.exports = {
	byTeamId: {
		teamId: 1
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
	},
	byIsTeamStream: {
		teamId: 1,
		isTeamStream: 1
	},
	byObject: {
		teamId: 1,
		type: 1,
		objectId: 1,
		objectType: 1
	}
};
