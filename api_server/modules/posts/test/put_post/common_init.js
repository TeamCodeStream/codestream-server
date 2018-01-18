// base class for many tests of the "PUT /posts" requests

'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class CommonInit {

	init (callback) {
		BoundAsync.series(this, [
			this.createOtherUser,	// create another registered user
			this.createRandomRepo,	// create a random repo (and team) for the test
			this.createRandomStream,	// create a stream in that repo
            this.createPost,        // create the post that will then be updated
			this.makePostData		// make the data to be used during the update
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
    			teamId: this.team._id,	// create the stream in the team we already created
                repoId: type === 'file' ? this.repo._id : undefined,  // file-type streams must have repoId
                memberIds: memberIds, // include current user in stream if needed
    			token: token	// the "other user" is the stream creator, unless otherwise specified
            }
		);
	}

	// create the post to be updated
	createPost (callback) {
		this.postFactory.createRandomPost(
			(error, response) => {
				if (error) { return callback(error); }
				this.post = response.post;
				callback();
			},
            {
                token: this.token,   // the "current" user is the creator of the post (and will be the updater)
                streamId: this.stream._id // create the post in the stream we created
            }
		);
	}

	// form the data for the post update
	makePostData (callback) {
        this.data = {
            text: this.postFactory.randomText()
        };
        this.path = '/posts/' + this.post._id;
        this.modifiedAfter = Date.now();
        callback();
	}
}

module.exports = CommonInit;
