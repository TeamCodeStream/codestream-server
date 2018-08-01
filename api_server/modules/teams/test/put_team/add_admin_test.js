'use strict';

const PutTeamTest = require('./put_team_test');
const Assert = require('assert');

class AddAdminTest extends PutTeamTest {

	get description () {
		return 'should return the updated stream and directive when adding a user as an admin to a team';
	}
   
	getExpectedFields () {
		let fields = super.getExpectedFields();
		return {
			team: {
				$set: fields.stream,
				$addToSet: ['adminIds']
			}
		};
	}

	// form the data for the team update
	makeTeamData (callback) {
		// find one of the other users in the team, and add them as an admin
		super.makeTeamData(() => {
			this.addedAdmins = this.getAddedAdmins();
			if (this.addedAdmins.length === 1) {
				// this tests conversion of single element to an array
				const addedAdmin = this.addedAdmins[0];
				this.data.$addToSet = { adminIds: addedAdmin._id };
				if (this.expectedTeam && this.expectedTeam.adminIds) {
					this.expectedTeam.adminIds.push(addedAdmin._id);
				}
			}
			else {
				const addedAdminIds = this.addedAdmins.map(user => user._id);
				this.data.$addToSet = { adminIds: addedAdminIds };
				if (this.expectedTeam && this.expectedTeam.adminIds) {
					this.expectedTeam.adminIds = this.expectedTeam.adminIds.concat(addedAdminIds);
				}
			}
			callback();
		});
	}

	// get the users we want to add as admins to the team
	getAddedAdmins () {
		return [this.otherUserData[1].user];
	}

	// validate the response to the test request
	validateResponse (data) {
		// verify we got a directive in the update to add the user as an admin
		let team = data.team;
		const adminsAdded = this.addedAdmins.map(user => user._id);
		adminsAdded.sort();
		team.$addToSet.adminIds.sort();
		Assert.deepEqual(adminsAdded, team.$addToSet.adminIds, 'added admins array not equal to the users who were added as admins');
		super.validateResponse(data, true);
	}
}

module.exports = AddAdminTest;
