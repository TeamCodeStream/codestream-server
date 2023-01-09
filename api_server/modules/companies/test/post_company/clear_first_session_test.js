'use strict';

const PostCompanyTest = require('./post_company_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const Assert = require('assert');

class ClearFirstSessionTest extends PostCompanyTest {

	constructor (options) {
		super(options);
		delete this.teamOptions.creatorIndex;
	}

	get description () {
		return 'when a user creates a second org, under one-user-per-org, the new user should have no firstSessionStartedAt attribute';
	}

	get method () {
		return 'get';
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.createCompany,
			this.doLogin,
			this.ensureFirstSession,
			this.createSecondCompany
		], callback);
	}

	 // create the user's first company
	createCompany (callback) {
		this.doApiRequest(
			{
				method: 'post',
				path: '/companies',
				data: this.data,
				token: this.token
			},
			callback
		)
	}

	// have the user login with email/password, establishing firstSessionStartedAt
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

	// have the user create a second company
	createSecondCompany (callback) {
		this.doApiRequest(
			{
				method: 'post',
				path: '/companies',
				data: {
					name: this.companyFactory.randomName()
				},
				token: this.token
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.path = '/users/me';
				this.token = response.accessToken;
				callback();
			}
		);
	}

	validateResponse (data) {
		Assert(data.user.firstSessionStartedAt === undefined, 'firstSessionStartedAt was defined in the fetched user');
	}
}

module.exports = ClearFirstSessionTest;
