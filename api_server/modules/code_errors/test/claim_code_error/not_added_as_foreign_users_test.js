'use strict';

const ForeignUsersTest = require('./foreign_users_test');

class NotAddedAsForeignUsersTest extends ForeignUsersTest {

	get description () {
		return 'when a code error is claimed by a team, all the authors of replies to that code error from the comment engine should be added as foreign users to the team, unless those users are already members of the team';
	}

	setTestOptions (callback) {
		this.expectedTeamVersion = 10;
		super.setTestOptions(() => {
			this.numChildPosts = 10;
			this.childPostByUser = [ , 3, 1, , 8, 4, , 2];
			this.userOptions.numRegistered = 5;
			this.userOptions.numUnregistered = 4;
			this.teamOptions.numAdditionalInvites = 0;
			callback();
		});
	}

}
module.exports = NotAddedAsForeignUsersTest;
