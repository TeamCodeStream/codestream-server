'use strict';

var CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class ACLRepoOnTheFlyCodeBlockStreamTest extends CodeStreamAPITest {

	get method () {
		return 'post';
	}

	get path () {
		return '/posts';
	}

	get description () {
		return 'should return an error when trying to create a post with a code block from an on-the-fly stream from a repo from a team that i\'m not a member of';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1011',
			reason: 'repo not owned by this team'
		};
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			this.createOtherUser,		// create a second user
			this.createRandomRepo,		// that user creates a repo
			this.createForeignRepo,     // that user creates another repo, which i'm not a member of
			this.createRandomStream,	// that user creates a channel stream in the first repo
			this.makePostData			// make data to send in creating the post
		], callback);
	}

	// create a second registered user
	createOtherUser (callback) {
		this.userFactory.createRandomUser(
			(error, response) => {
				if (error) { return callback(error); }
				this.otherUserData = response;
				callback();
			}
		);
	}

	// create a repo (which will create a team)
	createRandomRepo (callback) {
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				this.repo = response.repo;
				this.team = response.team;
				callback();
			},
			{
				withEmails: [this.currentUser.email],
				token: this.otherUserData.accessToken	// the other user is the creator of the repo
			}
		);
	}

	// create a repo (which will create a team), that the current user isn't a member of
	createForeignRepo (callback) {
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				this.foreignRepo = response.repo;
				this.foreignTeam = response.team;
				callback();
			},
			{
				token: this.otherUserData.accessToken	// the other user is the creator of the repo
			}
		);
	}

	// create a stream owned by the team
	createRandomStream (callback) {
		this.streamOptions = {
			type: 'channel',
			teamId: this.team._id,
			token: this.otherUserData.accessToken,	// the other user is the creator of the stream
			memberIds: [this.currentUser._id] 
		};
		this.streamFactory.createRandomStream(
			(error, response) => {
				if (error) { return callback(error); }
				this.stream = response.stream;
				callback();
			},
			this.streamOptions
		);
	}

	// make options to use when trying to create the post
	makePostData (callback) {
		const postOptions = {
			teamId: this.team._id,
			streamId: this.stream._id,
			wantCodeBlocks: 1,
			codeBlockStream: {
				repoId: this.foreignRepo._id,
				file: this.streamFactory.randomFile()
			}
		};
		this.postFactory.getRandomPostData(
			(error, data) => {
				if (error) { return callback(error); }
				this.data = data;
				callback();
			},
			postOptions
		);
	}
}

module.exports = ACLRepoOnTheFlyCodeBlockStreamTest;
