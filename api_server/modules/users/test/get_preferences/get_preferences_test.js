'use strict';

const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const Assert = require('assert');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');

class GetPreferencesTest extends CodeStreamAPITest {

	constructor (options) {
		super(options);
		this.userOptions.numRegistered = 1;
		delete this.teamOptions.creatorIndex;
	}
	
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
		BoundAsync.series(this, [
			super.before,
			this.setPreferences
		], callback);
	}

	setPreferences (callback) {
		// make the preferences data, and write it to the server,
		// we'll then read it back for the test
		const data = this.makePreferencesData();
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
		this.expectData.notifications = 'involveMe'; // a default 
		// validate that we got back the data we wrote
		Assert.deepEqual(data.preferences, this.expectData, 'returned preference data does not match');
	}
}

module.exports = GetPreferencesTest;
