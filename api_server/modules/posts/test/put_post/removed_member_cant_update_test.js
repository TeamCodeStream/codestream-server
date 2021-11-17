'use strict';

const PutPostTest = require('./put_post_test');

class RemovedMemberCantUpdateTest extends PutPostTest {

	get description () {
		return 'should return an error when the a user tries to update a post that they are the author of, but they have been removed from the team';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1010',
			reason: 'the user does not have access to this post'
		};
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.teamOptions.creatorIndex = 1;
			callback();
		});
	}

	makePostData (callback) {
		super.makePostData(error => {
			if (error) { return callback(error); }
			this.removeUserFromTeam(callback);
		});
	}

	removeUserFromTeam (callback) {
		this.doApiRequest(
			{
				method: 'put',
				path: '/teams/' + this.team.id,
				data: {
					$push: {
						removedMemberIds: this.currentUser.user.id
					}
				},
				token: this.users[1].accessToken
			},
			callback
		);
	}
}

module.exports = RemovedMemberCantUpdateTest;
