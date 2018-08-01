'use strict';

const PutTeamTest = require('./put_team_test');
const Assert = require('assert');
const ArrayUtilities = require(process.env.CS_API_TOP + '/server_utils/array_utilities');

class RemoveAdminTest extends PutTeamTest {

	constructor (options) {
		super(options);
		this.whichAdmins = 1;
	}
    
	get description () {
		return 'should return the updated team and directive when removing a user as an admin of a team';
	}
   
	getExpectedFields () {
		let fields = super.getExpectedFields();
		return {
			team: {
				$set: fields.team,
				$pull: ['adminIds']
			}
		};
	}

	// form the data for the team update
	makeTeamData (callback) {
		// find one of the other users in the team, and remove them as an admin
		super.makeTeamData(() => {
			this.removedAdmins = this.getRemovedAdmins();
			if (this.removedAdmins.length === 1) {
				// this tests conversion of single element to an array
				const removedAdmin = this.removedAdmins[0];
				this.data.$pull = { adminIds: removedAdmin._id };
				if (this.expectedTeam && this.expectedTeam.adminIds) {
					this.expectedTeam.adminIds = ArrayUtilities.difference(this.expectedTeam.adminIds, [removedAdmin._id]);
				}
			}
			else {
				const removedAdminIds = this.removedAdmins.map(user => user._id);
				this.data.$pull = { adminIds: removedAdminIds };
				if (this.expectedTeam && this.expectedTeam.adminIds) {
					this.expectedTeam.adminIds = ArrayUtilities.difference(this.expectedTeam.adminIds, removedAdminIds);
				}
			}
			callback();
		});
	}

	// get the users we want to remove as admins of the team
	getRemovedAdmins () {
		return [this.otherUserData[1].user];
	}

	// validate the response to the test request
	validateResponse (data) {
		// verify we got a directive in the update to remove the user as an admin
		let team = data.team;
		const adminsRemoved = this.removedAdmins.map(user => user._id);
		adminsRemoved.sort();
		team.$pull.adminIds.sort();
		Assert.deepEqual(adminsRemoved, team.$pull.adminIds, 'removed admins array not equal to the users who were removed as admins');
		super.validateResponse(data, true);
	}
}

module.exports = RemoveAdminTest;
