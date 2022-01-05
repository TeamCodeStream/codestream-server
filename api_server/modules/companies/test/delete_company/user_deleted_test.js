'use strict';

const DeleteCompanyTest = require('./delete_company_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');

class UserDeletedTest extends DeleteCompanyTest {

	get description () {
		return 'should deactivate the orphaned users when company deleted';
	}

	get method () {
		return 'get';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1009'
		};
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,	// do the usual test prep
			this.deleteCompany	// perform the actual deletion
		], callback);
	}

	changePath (callback) {
		this.path = '/users/' + this.currentUser.user.id;
		callback();
	}
}

module.exports = UserDeletedTest;
