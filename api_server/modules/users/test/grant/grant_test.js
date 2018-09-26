// provides the base class for all tests of the "PUT /grant/:channel" request

'use strict';

const CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class GrantTest extends CodeStreamAPITest {

	constructor (options) {
		super(options);
		this.data = {};
	}

	get method () {
		return 'put';
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			this.prepareOptions,		// prepare various options for the test
			super.before,
			this.createForeignTeam,		// create a team for the test where the current user is not a member (as needed)
			this.createForeignStream,	// create a stream for the test where the current user is not a member (as needed)
			this.createOtherStream,		// create another stream in the same team as the current user, but the current user is not a member
			this.setPath				// set the path to use when issuing the test request
		], callback);
	}

	prepareOptions (callback) {
		this.teamOptions.numAdditionalInvites = 0;
		if (!this.wantOtherUser) {
			this.userOptions.numRegistered = 1;
		}
		if (!this.wantTeam) {
			delete this.teamOptions.creatorIndex;
			delete this.teamOptions.inviterIndex;
		}
		else {
			this.teamOptions.creatorIndex = this.teamOptions.inviterIndex = 1;
		}
		if (this.wantStream) {
			this.streamOptions.creatorIndex = 1;
		}
		callback();
	}

	// create a team to use for the test, where the "current" user is not a member of the team (as needed)
	createForeignTeam (callback) {
		if (!this.wantForeignTeam) { return callback(); }	// not needed for this test
		this.teamFactory.createRandomTeam(
			(error, response) => {
				if (error) { return callback(error); }
				this.foreignTeam = response.team;
				callback();
			},
			{
				token: this.users[1].accessToken	// "other" user creates the repo and team
			}
		);
	}

	// create a "foreign" stream, it is in a team that the "current" user is not a member of
	createForeignStream (callback) {
		if (!this.wantForeignStream) { return callback(); }
		let streamOptions = {
			type: 'channel',
			teamId: this.foreignTeam._id,
			token: this.users[1].accessToken	// the "other" user creates the stream
		};
		this.streamFactory.createRandomStream(
			(error, response) => {
				if (error) { return callback(error); }
				this.foreignStream = response.stream;
				callback();
			},
			streamOptions
		);
	}

	// create a stream in the team the "current" user is a member of, but the current user will NOT 
	// be a member of the stream
	createOtherStream (callback) {
		if (!this.wantOtherStream) { return callback(); }
		let streamOptions = {
			type: 'channel',
			teamId: this.team._id,
			token: this.users[1].accessToken	// the "other" user creates the stream
		};
		this.streamFactory.createRandomStream(
			(error, response) => {
				if (error) { return callback(error); }
				this.otherStream = response.stream;
				callback();
			},
			streamOptions
		);
	}
}

module.exports = GrantTest;