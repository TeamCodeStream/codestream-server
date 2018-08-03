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
		BoundAsync.series(this, [
			this.createOtherUser,
			this.createTeam,
			this.inviteCurrentUser,
			this.preSetSettings,
			this.makeSettingsData
		], callback);
	}

	// create another registered user on the team, if needed (in addition to the "current" user)
	createOtherUser (callback) {
		if (!this.wantOtherUser) { return callback(); }
		this.userFactory.createRandomUser(
			(error, response) => {
				if (error) { return callback(error); }
				this.otherUserData = response;
				callback();
			}
		);
	}

	// create a random team
	createTeam (callback) {
		const token = this.otherUserData ? this.otherUserData.accessToken : this.token;
		this.teamFactory.createRandomTeam(
			(error, response) => {
				if (error) { return callback(error); }
				this.team = response.team;
				this.path = '/team-settings/' + this.team._id;
				callback();
			},
			{
				token: token
			}
		);
	}

	// if we created another user, then they created the team, so we need to invite
	// the current user to the team
	inviteCurrentUser (callback) {
		if (!this.otherUserData) { return callback(); }
		this.doApiRequest(
			{
				method: 'post',
				path: '/users',
				data: {
					teamId: this.team._id,
					email: this.currentUser.email
				},
				token: this.otherUserData.accessToken
			},
			callback
		);
	}

	// preset the team's settings with any settings we want in place 
	// before the actual test ... derived test class should override and
	// fill this.preSetData as appropriate
	preSetSettings (callback) {
		if (!this.preSetData) {
			return callback();
		}
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
				_id: this.team._id,
				$set: {
					'settings.simpleSetting': true
				}
			}
		};
		callback();
	}

	// validate the response to the test request
	validateResponse (data) {
		// verify we got back the expected settings update directive
		Assert.deepEqual(data, this.expectResponse);
	}
}

module.exports = PutTeamSettingsTest;
