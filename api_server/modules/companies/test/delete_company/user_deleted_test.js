'use strict';

const DeleteCompanyFetchTest = require('./delete_company_fetch_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');

class UserDeletedTest extends DeleteCompanyFetchTest {

	get description () {
		return 'should deactivate the orphaned users when company deleted, checked by trying to fetch a user';
	}

	get method () {
		return 'get';
	}

	getExpectedError () {
		return {
			code: 'AUTH-1004'
		};
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,	// do the usual test prep
			this.changePath
		], callback);
	}

	changePath (callback) {
		this.path = '/users/' + this.currentUser.user.id;
		callback();
	}
}

module.exports = UserDeletedTest;
