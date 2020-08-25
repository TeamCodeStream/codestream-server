'use strict';

const InviteInfoTest = require('./invite_info_test');

class UserNotFoundTest extends InviteInfoTest {

	get description () {
		return 'should return an error when requesting invite info but the invite code indicates a deactivated user';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1003',
			info: 'user'
		};
	}

	// before the test runs...
	before (callback) {
		super.before(error => {
			// deactivate the user to be invited
			if (error) { return callback(error); }
			this.doApiRequest(
				{
					method: 'delete',
					path: '/users/' + this.invitedUser.id,
					requestOptions: {
						headers: {
							'X-Delete-User-Secret': this.apiConfig.sharedSecrets.confirmationCheat
						}
					},
					token: this.token
				},
				callback
			);
		});
	}
}

module.exports = UserNotFoundTest;
