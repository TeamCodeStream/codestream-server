'use strict';

const PutTeamTest = require('./put_team_test');

class RemoveAdminTest extends PutTeamTest {

	constructor (options) {
		super(options);
		this.whichAdmins = 1;
	}
    
	get description () {
		return 'should return the updated team and directive when removing a user as an admin of a team';
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
				this.expectedData.team.$pull = { adminIds: [removedAdmin._id] };
			}
			else {
				const removedAdminIds = this.removedAdmins.map(user => user._id);
				this.data.$pull = { adminIds: removedAdminIds };
				this.expectedData.team.$pull = { adminIds: removedAdminIds };
			}
			callback();
		});
	}

	// get the users we want to remove as admins of the team
	getRemovedAdmins () {
		return [this.users[1].user];
	}
}

module.exports = RemoveAdminTest;
