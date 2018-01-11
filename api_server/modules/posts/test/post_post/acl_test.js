'use strict';

var CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class ACLTest extends CodeStreamAPITest {

	get method () {
		return 'post';
	}

	get path () {
		return '/posts';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1011'
		};
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			this.createOtherUser,		// create a second user
			this.createRandomRepo,		// that user creates a repo
			this.createRandomStream,	// that user creates a stream in that repo
			this.makePostOptions,		// set options for creating the post
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
				withEmails: this.withoutMeOnTeam ? null : [this.currentUser.email], // maybe ok if i'm on the team, but i won't be allowed for the stream
				withRandomEmails: 2,	// two other random users for good measure
				token: this.otherUserData.accessToken	// the other user is the creator of the repo
			}
		);
	}

	// create a stream owned by the team
	createRandomStream (callback) {
		this.streamOptions = {
			type: this.type || 'channel',
			teamId: this.team._id,
			repoId: this.type === 'file' ? this.repo._id : null,
			token: this.otherUserData.accessToken,	// the other user is the creator of the stream
			memberIds: this.withoutMeInStream ? null : [this.currentUser._id] // i'm included or not as needed for the test
		};
		if (this.onTheFly) {
			// we'll try to create the stream in the POST /post request, not in advance
			return callback();
		}
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
	makePostOptions (callback) {
		if (this.stream) {
			// we already created the stream, use its ID in the test
			this.postOptions = {
				streamId: this.stream._id
			};
			callback();
		}
		else {
			// get data to use in creating the stream "on-the-fly" when we
			// try to create the post
			this.streamFactory.getRandomStreamData(
				(error, data) => {
					if (error) { return callback(error); }
					this.postOptions = { stream: data };
					callback();
				},
				this.streamOptions
			);
		}
	}

	// get some random data to use in trying to create the post
	makePostData (callback) {
		this.postOptions.teamId = this.team._id;
		this.postFactory.getRandomPostData(
			(error, data) => {
				if (error) { return callback(error); }
				this.data = data;
				callback();
			},
			this.postOptions
		);
	}
}

module.exports = ACLTest;
