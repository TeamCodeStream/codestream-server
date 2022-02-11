'use strict';

const DeleteUserTest = require('./delete_user_test');
const Assert = require('assert');

class FetchTest extends DeleteUserTest {

	get description () {
		return 'should delete a user across environments when requested, checked by fetching the deleted user';
	}

	run (callback) {
		super.run(error => {
			if (error) { return callback(error); }
			this.fetchUser(callback);
		});
	}

	fetchUser (callback) {
		this.doApiRequest(
			{
				method: 'get',
				path: '/xenv/fetch-user?id=' + this.currentUser.user.id,
				requestOptions: {
					headers: {
						'X-CS-Auth-Secret': this.apiConfig.sharedSecrets.auth
					}
				}
			},
			(error, response) => {
				if (error) { return callback(error); }
				Assert(response.user.deactivated, 'user was not deactivated');
				callback();
			}
		);
	}
}

module.exports = FetchTest;
