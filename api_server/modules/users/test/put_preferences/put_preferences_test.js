// provide a base class for most tests of the "PUT /preferences" request

'use strict';

const CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
const Assert = require('assert');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class PutPreferencesTest extends CodeStreamAPITest {

	constructor (options) {
		super(options);
		this.userOptions.numRegistered = 1;
		delete this.teamOptions.creatorIndex;
		this.expectVersion = 3;
	}
	
	get description () {
		return 'should set a simple preference when requested, and return appropriate directives in the response';
	}

	get method () {
		return 'put';
	}

	get path () {
		return '/preferences';	
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.preSetPreferences,
			this.makePreferencesData
		], callback);
	}

	// preset the user's preferences with any preferences we want in place 
	// before the actual test ... derived test class should override and
	// fill this.preSetData as appropriate
	preSetPreferences (callback) {
		if (!this.preSetData) {
			return callback();
		}
		this.expectVersion++;
		this.doApiRequest({
			method: 'put',
			path: '/preferences',
			data: this.preSetData,
			token: this.token
		}, callback);
	}

	// make the preferences data that will be used to match when the preferences
	// are retrieved to verify the preferences change was successful
	makePreferencesData (callback) {
		this.expectPreferences = this.data = {
			simplePreference: true
		};
		this.expectResponse = this.getBaseExpectedResponse();
		this.expectResponse.user.$set['preferences.simplePreference'] = true;
		callback();
	}

	getBaseExpectedResponse () {
		return {
			user: {
				_id: this.currentUser.user._id,
				$set: {
					version: this.expectVersion
				},
				$version: {
					before: this.expectVersion - 1,
					after: this.expectVersion
				}
			}
		};
	}

	// validate the response to the test request
	validateResponse (data) {
		// verify we got back the expected preferences update directive
		Assert.deepEqual(data, this.expectResponse);
	}
}

module.exports = PutPreferencesTest;
