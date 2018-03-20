// base class for many tests of the "PUT /markers" requests

'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class CommonInit {

	init (callback) {
		BoundAsync.series(this, [
			this.createOtherUser,	// create another registered user
			this.createRandomRepo,	// create a random repo (and team) for the test
			this.createRandomStream,// create a stream in that repo
			this.createOtherStream, // create another stream, a channel or a direct stream, as needed
			this.createPost,        // create the post that will create the marker to be updated
			this.makeMarkerData		// make the data to be used during the update
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
		let withEmails = this.withoutOtherUserOnTeam ? [] : [this.currentUser.email];
		let token = this.withoutOtherUserOnTeam ? this.token : this.otherUserData.accessToken;
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				this.repo = response.repo;
				this.team = response.team;
				callback();
			},
			{
				withEmails: withEmails,	// include current user, unless we're not including the other user, in which case the current user is the repo creator
				withRandomEmails: 1,	// another user for good measure
				token: token	// the "other user" is the repo and team creator, unless otherwise specified
			}
		);
	}

	// create a random stream to use for the test
	createRandomStream (callback) {
		let token = this.withoutOtherUserOnTeam ? this.token : this.otherUserData.accessToken;
		let type = this.streamType || 'file';
		let memberIds = this.streamType !== 'file' ? [this.currentUser._id] : undefined;
		this.streamFactory.createRandomStream(
			(error, response) => {
				if (error) { return callback(error); }
				this.stream = response.stream;
				callback();
			},
			{
				type: type,
				teamId: this.team._id, // create the stream in the team we already created
				repoId: type === 'file' ? this.repo._id : undefined, // file-type streams must have repoId
				memberIds: memberIds, // include current user in stream if needed
				token: token // the "other user" is the stream creator, unless otherwise specified
			}
		);
	}

	// create a random channel or direct stream to use for the test
	// if needed for the test, this is the stream that actually contains the post that
	// references the marker, which can be different than the stream the marker is
	// associated with
	createOtherStream (callback) {
		if (!this.fromOtherStreamType) { return callback(); }
		let token = this.otherUserData.accessToken;
		let type = this.fromOtherStreamType;
		let memberIds = this.fromOtherStreamType !== 'file' ? [this.currentUser._id] : undefined;
		this.streamFactory.createRandomStream(
			(error, response) => {
				if (error) { return callback(error); }
				this.otherStream = response.stream;
				callback();
			},
			{
				type: type,
				teamId: this.team._id, // create the stream in the team we already created
				memberIds: memberIds, // include current user in stream if needed
				token: token // the "other user" is the stream creator, unless otherwise specified
			}
		);
	}

	// create the post that creates the marker to be updated
	createPost (callback) {
		const streamId = this.fromOtherStreamType ? this.otherStream._id : this.stream._id;
		this.postFactory.createRandomPost(
			(error, response) => {
				if (error) { return callback(error); }
				this.post = response.post;
				this.marker = response.markers[0];
				callback();
			},
			{
				token: this.token,   // the "current" user is the creator of the post (and will be the updater)
				streamId: streamId, // create the post in the stream we created, might be a different stream than the marker references
				wantCodeBlocks: 1,  // must have code block to create a marker
				codeBlockStreamId: this.fromOtherStreamType ? this.stream._id : undefined // maybe different stream
			}
		);
	}

	// form the data for the marker update
	makeMarkerData (callback) {
		this.data = {
			commitHashWhenCreated: this.repoFactory.randomCommitHash()
		};
		this.path = '/markers/' + this.marker._id;
		callback();
	}
}

module.exports = CommonInit;
