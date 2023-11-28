'use strict';

const NewRelicRefreshTest = require('./newrelic_refresh_test');

class UserNotFoundTest extends NewRelicRefreshTest {

	get description () {
		return 'should return an error when attempting to refresh a New Relic access token for a user not known to CodeStream';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1003',
			info: 'user'
		};
	}

	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			let [, , payload, random] = this.data.refreshToken.split('-');
			const nrUserId = this.getMockNRUserId();
			const json = JSON.parse(Buffer.from(payload, 'base64').toString());
			json.nr_userid = nrUserId;
			payload = Buffer.from(JSON.stringify(json)).toString('base64');
			this.data.refreshToken = `MNRRA-${nrUserId}-${payload}-${random}`;
			this.apiRequestOptions.headers['X-CS-NR-Mock-User'] = JSON.stringify(this.getMockUser());
			callback();
		});
	}
}

module.exports = UserNotFoundTest;
