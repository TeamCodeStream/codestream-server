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

	before (callback) {
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

	makePreferencesData () {
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

	validateResponse (data) {
		Assert.deepEqual(data.preferences, this.expectData, 'returned preference data does not match');
	}
}

module.exports = GetPreferencesTest;
