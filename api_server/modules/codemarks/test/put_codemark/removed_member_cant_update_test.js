'use strict';

const PutCodemarkTest = require('./put_codemark_test');

class RemovedMemberCantUpdateTest extends PutCodemarkTest {

	get description () {
		return 'should return an error when the a user tries to update a codemark that they are the author of, but they have been removed from the team';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1010',
			reason: 'user must be on the team that owns the codemark'
		};
	}

	makeCodemarkUpdateData (callback) {
		super.makeCodemarkUpdateData(error => {
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
