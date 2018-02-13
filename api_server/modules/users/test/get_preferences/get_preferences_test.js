'use strict';

var CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
var Assert = require('assert');

class GetPreferencesTest extends CodeStreamAPITest {

	get description () {
		return 'should return my preferences when requesting them';
	}

	get method () {
		return 'get';
	}

	get path () {
		return '/preferences';
	}

	// before the test runs...
	before (callback) {
		// make the preferences data, and write it to the server,
		// we'll then read it back for the test
		let data = this.makePreferencesData();
		this.doApiRequest(
			{
				method: 'put',
				path: '/preferences',
				data: data,
				token: this.token
			},
			callback
		);
	}

	// make the preferences data for the test, which we'll write out to the 
	// server and then read back 
	makePreferencesData () {
		// a multi-level mix of stuff...
		this.expectData = {
			simplePreference: true,
			topLevelPreference: {
				a: 1,
				b: 2
			},
			multiLevelPreference: {
				level1: {
					a: 1,
					b: 2
				},
				level2: {
					c: 1,
					d: 2
				}
			}
		};
		return this.expectData;
	}

	// validate the response to the test request
	validateResponse (data) {
		// validate that we got back the data we wrote
		Assert.deepEqual(data.preferences, this.expectData, 'returned preference data does not match');
	}
}

module.exports = GetPreferencesTest;
