'use strict';

const JoinCompanyTest = require('./join_company_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const Assert = require('assert');

class ClearFirstSessionTest extends JoinCompanyTest {

	get description () {
		return 'when a user accepts an invite to a new org, the new user should have no firstSessionStartedAt attribute';
	}

	get method () {
		return 'get';
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,	// do the usual test prep
			this.doLogin,
			this.ensureFirstSession,
			this.doJoin	// perform the actual join
		], callback);
	}

	// have the user login, establishing firstSessionStartedAt
	doLogin (callback) {
		this.doApiRequest(
			{
				method: 'put',
				path: '/login',
				token: this.token
			},
			callback
		);
	}

	// make sure firstSessionStartedAt is actually defined in the original user
	ensureFirstSession (callback) {
		this.doApiRequest(
			{
				method: 'get',
				path: '/users/me',
				token: this.token
			},
			(error, response) => {
				if (error) { return callback(error); }
				Assert(typeof response.user.firstSessionStartedAt === 'number', 'firstSessionStartedAt does not start out as defined');
				this.path = '/users/me';
				callback();
			}
		)
	}

	validateResponse (data) {
		Assert(data.user.firstSessionStartedAt === undefined, 'firstSessionStartedAt was defined in the fetched user');
	}
}

module.exports = ClearFirstSessionTest;
