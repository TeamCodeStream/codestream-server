'use strict';

const CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
const RandomString = require('randomstring');

class IllegalSlackChannelNameTest extends CodeStreamAPITest {

	get method () {
		return 'post';
	}

	get path () {
		return '/streams';
	}

	get description () {
		return `should not allow '${this.illegalCharacter}' character in channel names when team is connected to slack`;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: {
				name: 'illegal characters in channel name'
			}
		};
	}

	dontWantToken () {
		return true;
	}

	// before the test runs...
	before (callback) {
		this.createSlackTeam(callback);
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
					teamId: team._id,
					type: 'channel',
					name: `channel${this.illegalCharacter}`
				};
				this.token = response.accessToken;
				callback();
			}
		);
	}
}

module.exports = IllegalSlackChannelNameTest;
