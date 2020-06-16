'use strict';

const PutTeamTest = require('./put_team_test');

class AddAdminTest extends PutTeamTest {

	get description () {
		return 'should return the updated stream and directive when adding a user as an admin to a team';
	}
   
	// form the data for the team update
	makeTeamData (callback) {
		// find one of the other users in the team, and add them as an admin
		super.makeTeamData(() => {
			this.addedAdmins = this.getAddedAdmins();
			if (this.addedAdmins.length === 1) {
				// this tests conversion of single element to an array
				const addedAdmin = this.addedAdmins[0];
				this.data.$addToSet = { adminIds: addedAdmin.id };
				this.expectedData.team.$addToSet = { adminIds: [addedAdmin.id] };
			}
			else {
				const addedAdminIds = this.addedAdmins.map(user => user.id);
				this.data.$addToSet = { adminIds: addedAdminIds };
				this.expectedData.team.$addToSet = { adminIds: addedAdminIds };
			}
			callback();
		});
	}

	// get the users we want to add as admins to the team
	getAddedAdmins () {
		return [this.users[1].user];
	}
}

module.exports = AddAdminTest;
