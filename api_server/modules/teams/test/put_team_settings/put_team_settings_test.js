// provide a base class for most tests of the "PUT /team-settings" request

'use strict';

const CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
const Assert = require('assert');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class PutTeamSettingsTest extends CodeStreamAPITest {

	get description () {
		return 'should set a simple team setting when requested, and return appropriate directives in the response';
	}

	get method () {
		return 'put';
	}

	// before the test runs...
	before (callback) {
		this.expectVersion = 4;
		BoundAsync.series(this, [
			super.before,
			this.preSetSettings,
			this.makeSettingsData
		], callback);
	}

	// preset the team's settings with any settings we want in place 
	// before the actual test ... derived test class should override and
	// fill this.preSetData as appropriate
	preSetSettings (callback) {
		this.path = '/team-settings/' + this.team.id;
		if (!this.preSetData) {
			return callback();
		}
		this.expectVersion++;
		this.doApiRequest({
			method: 'put',
			path: this.path,
			data: this.preSetData,
			token: this.token
		}, callback);
	}

	// make the settings data that will be used to match when the settings
	// are retrieved to verify the settings change was successful
	makeSettingsData (callback) {
		this.expectSettings = this.data = {
			simpleSetting: true
		};
		this.expectResponse = {
			team: {
				_id: this.team.id,	// DEPRECATE ME
				id: this.team.id,
				$set: {
					'settings.simpleSetting': true
				}
			}
		};
		this.updatedAt = Date.now();
		callback();
	}

	// validate the response to the test request
	validateResponse (data) {
		Assert(data.team.$set.modifiedAt > this.updatedAt, 'modifiedAt was not changed');
		this.expectResponse.team.$set = this.expectResponse.team.$set || {};
		this.expectResponse.team.$set.modifiedAt = data.team.$set.modifiedAt;
		this.expectResponse.team.$set.version = this.expectVersion;
		this.expectResponse.team.$version = {
			before: this.expectVersion - 1,
			after: this.expectVersion
		};
		// verify we got back the expected settings update directive
		Assert.deepEqual(data, this.expectResponse);
	}
}

module.exports = PutTeamSettingsTest;
