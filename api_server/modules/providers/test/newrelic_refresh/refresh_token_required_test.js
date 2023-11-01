'use strict';

const NewRelicRefreshTest = require('./newrelic_refresh_test');

class RefreshTokenRequiredTest extends NewRelicRefreshTest {

	constructor (options) {
		super(options);
		this.runRequestAsTest = true;
	}

	get description () {
		return 'should return an error when attempting to refresh a New Relic access token without supplying a refresh token';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1001',
			info: 'refreshToken'
		};
	}

	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			delete this.data.refreshToken;
			callback();
		});
	}
}

module.exports = RefreshTokenRequiredTest;
