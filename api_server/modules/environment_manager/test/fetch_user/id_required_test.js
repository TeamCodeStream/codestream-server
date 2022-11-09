'use strict';

const FetchUserTest = require('./fetch_user_test');

class IdRequiredTest extends FetchUserTest {

	constructor (options) {
		super(options);
		this.oneUserPerOrg = true;
	}
	
	get description () {
		return 'should return an error when submitting a request to fetch a user without providing an id, under one-user-per-org';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1001',
			info: 'id'
		};
	}

	// before the test runs...
	before (callback) {
		// delete the email from the url
		super.before(error => {
			if (error) { return callback(error); }
			this.path = '/xenv/fetch-user';
			callback();
		});
	}
}

module.exports = IdRequiredTest;
