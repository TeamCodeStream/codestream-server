'use strict';

const DeletePostTest = require('./delete_post_test');

class RemovedMemberCantDeleteTest extends DeletePostTest {

	get description () {
		return 'should return an error when the a user tries to delete a post that they are the author of, but they have been removed from the team';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1013',
			reason: 'the user does not have access to this post'
		};
	}

	setExpectedData (callback) {
		super.setExpectedData(error => {
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

module.exports = RemovedMemberCantDeleteTest;
