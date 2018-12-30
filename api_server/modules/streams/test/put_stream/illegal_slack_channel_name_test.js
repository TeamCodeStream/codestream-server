'use strict';

const CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
const RandomString = require('randomstring');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class IllegalSlackChannelNameTest extends CodeStreamAPITest {

	constructor (options) {
		super(options);
		this.userOptions.numRegistered = 0;
		delete this.teamOptions.creatorIndex;
	}

	get method () {
		return 'put';
	}

	get description () {
		return `should not allow '${this.illegalCharacter}' character in updated channel names when team is connected to slack`;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: {
				name: 'illegal characters in channel name'
			}
		};
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.createSlackTeam,
			this.createStream
		], callback);
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
				this.team = response.teams[0];
				this.token = response.accessToken;
				callback();
			}
		);
	}

	// create the test stream
	createStream (callback) {
		const name = RandomString.generate(9).toLowerCase();
		this.streamFactory.createRandomStream(
			(error, response) => {
				if (error) { return callback(error); }
				this.path = '/streams/' + response.stream.id;
				this.data = {
					name: `${RandomString.generate(4)}${this.illegalCharacter}${RandomString.generate(4)}`
				};
				callback();
			},
			{
				type: 'channel', 
				teamId: this.team.id,
				name,
				token: this.token
			}
		);
	}
}

module.exports = IllegalSlackChannelNameTest;
