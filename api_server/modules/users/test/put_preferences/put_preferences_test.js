'use strict';

var CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
var Assert = require('assert');
var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class PutPreferencesTest extends CodeStreamAPITest {

	get description () {
		return 'should set a simple preference when requested';
	}

	get method () {
		return 'get';
	}

	get path () {
		return '/users/me';	// we'll actually validate by retrieving the me object
	}

	before (callback) {
		BoundAsync.series(this, [
			this.preSetPreferences,
			this.setPreferences
		], callback);
	}

	preSetPreferences (callback) {
		return callback();
	}

	setPreferences (callback) {
		let data = this.makePreferencesData();
		this.putPreferences(data, callback);
	}

	putPreferences (data, callback) {
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

	makePreferencesData () {
		this.expectPreferences = {
			simplePreference: true
		};
		return this.expectPreferences;
	}

	validateResponse (data) {
		Assert.deepEqual(data.user.preferences, this.expectPreferences);
	}
}

module.exports = PutPreferencesTest;
