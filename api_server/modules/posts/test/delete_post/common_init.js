// base class for many tests of the "PUT /posts" requests

'use strict';

const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class CommonInit {

	init (callback) {
		BoundAsync.series(this, [
			this.createTeamCreator,	// create another register user who will create the repo and team for the test
			this.createOtherUser,	// create another registered user
			this.createRandomRepo,	// create a random repo (and team) for the test
			this.createRandomStream,	// create a stream in that repo
			this.createParentPost,	// create a parent post, for replies, if needed
			this.createPost        // create the post that will then be deactivated
		], callback);
	}

	// create another register user who will create the repo and team for the test
	createTeamCreator (callback) {
		this.userFactory.createRandomUser(
			(error, response) => {
				if (error) { return callback(error); }
				this.teamCreatorData = response;
				callback();
			}
		);
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
		const withEmails = [
			this.otherUserData.user.email
		];
		if (!this.withoutCurrentUserOnTeam) {
			withEmails.push(this.currentUser.email);
		}
		const token = this.teamCreatorData.accessToken; 
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
				token			
			}
		);
	}

	// create a random stream to use for the test
	createRandomStream (callback) {
		const token = this.teamCreatorData.accessToken;
		const type = this.streamType || 'file';
		const memberIds = this.streamType !== 'file' ? [this.currentUser._id] : undefined;
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
				token
			}
		);
	}

	// create a parent post, if we are testing the deletion of a reply
	createParentPost (callback) {
		if (!this.wantParentPost) { return callback(); 	}	// only if needed for the test
		this.postFactory.createRandomPost(
			(error, response) => {
				if (error) { return callback(error); }
				this.parentPost = response.post;
				callback();
			},
			{
				token: this.otherUserData.accessToken,   // we'll let the "other" user create the parent post
				streamId: this.stream._id,	// create the post in the stream we created
				wantCodeBlocks: 1			// create a code block when creating a parent post
			}
		);
	}

	// create the post to be updated
	createPost (callback) {
		const token = this.otherUserCreatesPost ? this.otherUserData.accessToken : this.token;
		let postOptions = {
			token,   // the "current" user is the creator of the post, unless otherwise specified
			streamId: this.stream._id, // create the post in the stream we created
			wantCodeBlocks: this.wantCodeBlocks	// with code blocks, to create markers
		};
		if (this.parentPost) {
			postOptions.parentPostId = this.parentPost._id;
		}
		this.postFactory.createRandomPost(
			(error, response) => {
				if (error) { return callback(error); }
				this.post = response.post;
				this.path = '/posts/' + this.post._id;
				this.modifiedAfter = Date.now();
				callback();
			},
			postOptions
		);
	}
}

module.exports = CommonInit;
