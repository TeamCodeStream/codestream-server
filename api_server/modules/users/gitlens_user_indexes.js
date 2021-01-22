// indexes for the gitLensUsers collection, tracking GitLens users for later matchup to signups

'use strict';

module.exports = {
	byId: {
		_id: 1
	},
	byEmailHash: {
		emailHash: 1
	},
	byMachineIdHash: {
		machineIdHash: 1
	}
};
