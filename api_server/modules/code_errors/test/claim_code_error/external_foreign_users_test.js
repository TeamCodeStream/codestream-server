'use strict';

const NotAddedAsForeignUsersTest = require('./not_added_as_foreign_users_test');

class ExternalForeignUsersTest extends NotAddedAsForeignUsersTest {

	get description () {
		return 'when a code error is claimed by a team, all the authors of replies to that code error from the comment engine should be added as foreign users to the team, unless those users are already members of the team';
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.expectedTeamVersion = 5;
			this.teamOptions.members = [0, 1, 2];
			callback();
		});
	}

}
module.exports = ExternalForeignUsersTest;
