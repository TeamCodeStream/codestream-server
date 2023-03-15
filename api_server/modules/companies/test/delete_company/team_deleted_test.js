'use strict';

const DeleteCompanyFetchTest = require('./delete_company_fetch_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');

class TeamDeletedTest extends DeleteCompanyFetchTest {

	get description () {
		return 'should deactivate the everyone team when a company is deleted, checked by trying to fetch the team';
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
			this.changePath,
		], callback);
	}

	changePath (callback) {
		this.path = '/teams/' + this.team.id;
		callback();
	}
}

module.exports = TeamDeletedTest;
