// provides the base class for all tests of the "PUT /grant/:channel" request

'use strict';

var CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

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
			this.createOtherUser,		// create a second registered user
			this.createRepo,			// create a repo (and team) for the test
			this.createForeignRepo,		// create a repo (and team) for the test where the current user is not a member (as needed)
			this.createStream,			// create a stream for the test
			this.createForeignStream,	// create a stream for the test where the current user is not a member (as needed)
			this.createOtherStream,		// create another stream in the same team as the current user, but the current user is not a member
			this.setPath				// set the path to use when issuing the test request
		], callback);
	}

	// create a second registered user
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

	// create a repo (and team) to use for the test
	createRepo (callback) {
		if (!this.wantRepo) { return callback(); }
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				this.repo = response.repo;
				this.team = response.team;
				callback();
			},
			{
				withEmails: [this.currentUser.email],	// include the "current" user in the team
				token: this.otherUserData.accessToken	// the "other" user creates the team
			}
		);
	}

	// create a repo (and team) to use for the test, where the "current" user is not a member of the team (as needed)
	createForeignRepo (callback) {
		if (!this.wantForeignRepo) { return callback(); }	// not needed for this test
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				this.foreignRepo = response.repo;
				this.foreignTeam = response.team;
				callback();
			},
			{
				token: this.otherUserData.accessToken	// "other" user creates the repo and team
			}
		);
	}

	// create a (channel) stream in the team
	createStream (callback) {
		if (!this.wantStream) { return callback(); }
		let streamOptions = {
			type: 'channel',
			teamId: this.team._id,
			token: this.otherUserData.accessToken,	// the "other" user creates the stream
			memberIds: [this.currentUser._id]		// include the "current" user in the stream
		};
		this.streamFactory.createRandomStream(
			(error, response) => {
				if (error) { return callback(error); }
				this.stream = response.stream;
				callback();
			},
			streamOptions
		);
	}

	// create a "foreign" stream, it is in a team that the "current" user is not a member of
	createForeignStream (callback) {
		if (!this.wantForeignStream) { return callback(); }
		let streamOptions = {
			type: 'channel',
			teamId: this.foreignTeam._id,
			token: this.otherUserData.accessToken	// the "other" user creates the stream
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
			token: this.otherUserData.accessToken	// the "other" user creates the stream
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