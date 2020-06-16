'use strict';

const CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
const RandomString = require('randomstring');

class SlackChannelNameTooLongTest extends CodeStreamAPITest {

	get method () {
		return 'post';
	}

	get path () {
		return '/streams';
	}

	get description () {
		return 'should not allow channel names longer than 21 characters when team is connected to slack';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: {
				name: 'name must be no longer than 21 characters'
			}
		};
	}

	dontWantToken () {
		return true;
	}

	// before the test runs...
	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			this.createSlackTeam(callback);
		});
	}

	// create a slack-connected team
	createSlackTeam (callback) {
		const providerInfo = {
			code: `mock-${RandomString.generate(8)}-${RandomString.generate(8)}`,
			redirectUri: `mock://${RandomString.generate(8)}`,
		};
		this.doApiRequest(
			{
				method: 'put',
				path: '/no-auth/provider-connect/slack',
				data: {
					providerInfo,
					_pubnubUuid: this.userFactory.getNextPubnubUuid()
				}
			},
			(error, response) => {
				if (error) { return callback(error); }
				const team = response.teams[0];
				this.data = {
					teamId: team.id,
					type: 'channel',
					name: 'abcdefghijklmnopqrstuv'
				};
				this.token = response.accessToken;
				callback();
			}
		);
	}
}

module.exports = SlackChannelNameTooLongTest;
