'use strict';

const DeleteCompanyTest = require('./delete_company_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');

class DeactivatedUserTest extends DeleteCompanyTest {

	get description () {
		return 'should deactivate a company when company has a deactivated user already';
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.deleteSecondUser
		], callback);
	}

	deleteSecondUser (callback) {
		this.doApiRequest(
			{
				method: 'delete',
				path: `/users/${this.users[1].user.id}`,
				requestOptions: {
					headers: {
						'X-Delete-User-Secret': this.apiConfig.sharedSecrets.confirmationCheat
					}
				},
				token: this.token
			},
			callback
		);
	}
}

module.exports = DeactivatedUserTest;
