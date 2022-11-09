'use strict';

const DeleteCodemarkTest = require('./delete_codemark_test');

class RemovedMemberCantDeleteTest extends DeleteCodemarkTest {

	get description () {
		return 'should return an error when the a user tries to delete a codemark that they are the author of, but they have been removed from the team';
	}

	getExpectedError () {
		return {
			code: 'AUTH-1004' // removed member gets deactivated, under one-user-per-org, can't use their token
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
