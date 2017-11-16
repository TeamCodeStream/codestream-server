'use strict';

var CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');

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

	before (callback) {
		BoundAsync.series(this, [
			this.createOtherUser,
			this.createRandomRepo,
			this.createRandomStream,
			this.makePostOptions,
			this.makePostData
		], callback);
	}

	createOtherUser (callback) {
		this.userFactory.createRandomUser(
			(error, response) => {
				if (error) { return callback(error); }
				this.otherUserData = response;
				callback();
			}
		);
	}

	createRandomRepo (callback) {
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				this.repo = response.repo;
				this.team = response.team;
				callback();
			},
			{
				withEmails: this.withoutMeOnTeam ? null : [this.currentUser.email],
				withRandomEmails: 2,
				token: this.otherUserData.accessToken
			}
		);
	}

	createRandomStream (callback) {
		this.streamOptions = {
			type: this.type || 'channel',
			teamId: this.team._id,
			repoId: this.type === 'file' ? this.repo._id : null,
			token: this.otherUserData.accessToken,
			memberIds: this.withoutMeInStream ? null : [this.currentUser._id]
		};
		if (this.onTheFly) {
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

	makePostOptions (callback) {
		if (this.stream) {
			this.postOptions = {
				streamId: this.stream._id
			};
			callback();
		}
		else {
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
