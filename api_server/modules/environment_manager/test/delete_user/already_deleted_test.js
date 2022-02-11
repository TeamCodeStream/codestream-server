'use strict';

const DeleteUserTest = require('./delete_user_test');

class AlreadyDeletedTest extends DeleteUserTest {

	get description () {
		return 'should return an error when deleting a user across environments that has already been deleted';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1014'
		};
	}

	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			this.deleteUser(callback);
		});
	}

	deleteUser (callback) {
		this.doApiRequest(
			{
				method: 'delete',
				path: '/xenv/delete-user/' + this.currentUser.user.id,
				requestOptions: {
					headers: {
						'X-CS-Auth-Secret': this.apiConfig.sharedSecrets.auth
					}
				}
			},
			callback
		);
	}
}

module.exports = AlreadyDeletedTest;
