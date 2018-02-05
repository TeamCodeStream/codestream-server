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

	before (callback) {
		BoundAsync.series(this, [
			this.createOtherUser,
			this.createRepo,
			this.createForeignRepo,
			this.createStream,
			this.createForeignStream,
			this.createOtherStream,
			this.setPath
		], callback);
	}

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
				withEmails: [this.currentUser.email],
				token: this.otherUserData.accessToken
			}
		);
	}

	createForeignRepo (callback) {
		if (!this.wantForeignRepo) { return callback(); }
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				this.foreignRepo = response.repo;
				this.foreignTeam = response.team;
				callback();
			},
			{
				token: this.otherUserData.accessToken
			}
		);
	}

	createStream (callback) {
		if (!this.wantStream) { return callback(); }
		let streamOptions = {
			type: 'channel',
			teamId: this.team._id,
			repoId: this.repo._id,
			token: this.otherUserData.accessToken,
			memberIds: [this.currentUser._id]
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

	createForeignStream (callback) {
		if (!this.wantForeignStream) { return callback(); }
		let streamOptions = {
			type: 'channel',
			teamId: this.foreignTeam._id,
			repoId: this.foreignRepo._id,
			token: this.otherUserData.accessToken
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

	createOtherStream (callback) {
		if (!this.wantOtherStream) { return callback(); }
		let streamOptions = {
			type: 'channel',
			teamId: this.team._id,
			repoId: this.repo._id,
			token: this.otherUserData.accessToken
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