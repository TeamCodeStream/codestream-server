// base class for many tests of the "PUT /markers" requests

'use strict';

const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const RandomString = require('randomstring');

class CommonInit {

	init (callback) {
		BoundAsync.series(this, [
			this.createOtherUser,	// create another registered user
			this.createRandomRepo,	// create a random repo (and team) for the test
			this.createFileStream,	// create a file stream for the marker to reference
			this.addRemotesToRepo,	// add some remotes to the repo by creating a post
			this.makeMarkerData		// make the data associated with the test marker to be created
		], callback);
	}

	// create another registered user (in addition to the "current" user)
	createOtherUser (callback) {
		this.userFactory.createRandomUser(
			(error, response) => {
				if (error) { return callback(error); }
				this.otherUserData = response;
				callback();
			}
		);
	}

	// create a random repo to use for the test
	createRandomRepo (callback) {
		const withEmails = this.userNotOnTeam ? [] : [this.currentUser.email];
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				this.repo = response.repo;
				this.team = response.team;
				this.users = response.users;
				callback();
			},
			{
				withEmails,
				token: this.otherUserData.accessToken	// the "other user" is the repo and team creator
			}
		);
	}

	// introduce additional remotes to the repo we created by
	// submitting a post and creating a stream on the fly as we do it,
	// with remotes specified in the code block for the post
	addRemotesToRepo (callback) {
		if (!this.wantRemotes) {
			return callback();
		}
		const remotes = [
			...this.repo.remotes.map(repo => repo.url), 
			...this.wantRemotes
		];
		this.postFactory.createRandomPost(
			callback,
			{
				wantCodeBlocks: 1,
				stream: {
					teamId: this.team._id,
					type: 'channel',
					name: this.streamFactory.randomName()
				},
				codeBlockStream: {
					file: this.streamFactory.randomFile(),
					remotes
				},
				token: this.otherUserData.accessToken
			}
		);
	}
	
	// create a random file stream for the marker to reference
	createFileStream (callback) {
		this.streamFactory.createRandomStream(
			(error, response) => {
				if (error) { return callback(error); }
				this.stream = response.stream;
				callback();
			},
			{
				teamId: this.team._id,
				repoId: this.repo._id,
				type: 'file',
				token: this.otherUserData.accessToken
			}
		);
	}

	// form the data for the marker we'll create in the test
	makeMarkerData (callback) {
		this.markerCreatedAfter = Date.now();
		this.markerFactory.getRandomMarkerData(
			(error, data) => {
				if (error) { return callback(error); }
				this.data = Object.assign(data, {
					teamId: this.team._id,
					streamId: this.stream._id,
					providerType: 'slack',
					code: RandomString.generate(1000),
					postId: RandomString.generate(10),
					postStreamId: RandomString.generate(10),
					commitHash: this.repoFactory.randomCommitHash()
				});
				callback();
			}
		);
	}
}

module.exports = CommonInit;
