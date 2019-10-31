'use strict';

const AddFollowersTest = require('./add_followers_test');

class FollowerNotOnTeamTest extends AddFollowersTest {

	get description () {
		return 'should return an error if a user from a different team is added as the follower of a codemark';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: 'followers must contain only users on the team'
		};
	}

	setTestOptions( callback) {
		super.setTestOptions(() => {
			// create an additional user that won't be on the team, then include them as a follower
			this.userOptions.numRegistered = 6;
			this.teamOptions.members = [0, 1, 2, 3, 4];
			callback();
		});
	}

	makeCodemarkData (callback) {
		super.makeCodemarkData(() => {
			// include a user not on the team as a follower
			this.data.followerIds.push(this.users[5].user.id);
			callback();
		});
	}
}

module.exports = FollowerNotOnTeamTest;
