'use strict';

const PutTeamTest = require('./put_team_test');
const Assert = require('assert');
const ArrayUtilities = require(process.env.CS_API_TOP + '/server_utils/array_utilities');

class RemoveUserTest extends PutTeamTest {

	get description () {
		return 'should return the updated team and directive when removing a user from a team';
	}
   
	getExpectedFields () {
		let fields = super.getExpectedFields();
		return {
			team: {
				$set: fields.team,
				$pull: ['memberIds']
			}
		};
	}

	// form the data for the team update
	makeTeamData (callback) {
		// find one of the other users in the team, and remove them from the team
		super.makeTeamData(() => {
			this.removedUsers = this.getRemovedUsers();
			if (this.removedUsers.length === 1) {
				// this tests conversion of single element to an array
				const removedUser = this.removedUsers[0];
				this.data.$pull = { memberIds: removedUser._id };
				if (this.expectedTeam && this.expectedTeam.memberIds) {
					this.expectedTeam.memberIds = ArrayUtilities.difference(this.expectedTeam.memberIds, [removedUser._id]);
				}
			}
			else {
				const removedUserIds = this.removedUsers.map(user => user._id);
				this.data.$pull = { memberIds: removedUserIds };
				if (this.expectedTeam && this.expectedTeam.memberIds) {
					this.expectedTeam.memberIds = ArrayUtilities.difference(this.expectedTeam.memberIds, removedUserIds);
				}
			}
			callback();
		});
	}

	// get the users we want to remove from the team
	getRemovedUsers () {
		return [this.otherUserData[1].user];
	}

	// validate the response to the test request
	validateResponse (data) {
		// verify we got a directive in the update to remove the user
		let team = data.team;
		const membersRemoved = this.removedUsers.map(user => user._id);
		membersRemoved.sort();
		team.$pull.memberIds.sort();
		Assert.deepEqual(membersRemoved, team.$pull.memberIds, 'removed membership array not equal to the users who were removed');
		Assert(team.$pull.adminIds, 'response should include removal of user as an admin');
		team.$pull.adminIds.sort();
		Assert.deepEqual(membersRemoved, team.$pull.adminIds, 'removed admin array not equal to the users who were removed');
		super.validateResponse(data, true);
	}
}

module.exports = RemoveUserTest;
