'use strict';

const DeleteUserTest = require('./delete_user_test');

class AlreadyDeletedTest extends DeleteUserTest {

	get description () {
		return 'should return an error when trying to delete a user that has already been deleted';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1014'
		};
	}

	// before the test runs...
	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			// delete the user, ahead of time...
			this.doApiRequest(
				{
					method: 'delete',
					path: '/users/' + this.user.id,
					token: this.token
				},
				callback
			);
		});
	}
}

module.exports = AlreadyDeletedTest;
