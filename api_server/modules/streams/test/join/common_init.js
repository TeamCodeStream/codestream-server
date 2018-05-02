// base class for many tests of the "PUT /join/:id" requests

'use strict';

const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const DeepClone = require(process.env.CS_API_TOP + '/server_utils/deep_clone');

class CommonInit {

	init (callback) {
		BoundAsync.series(this, [
			this.createOtherUser,	// create another registered user
			this.createRandomRepo,	// create a random repo (and team) for the test
			this.createRandomStream	// create the stream that the current user will then join
		], callback);
	}

	get method () {
		return 'put';
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
		let withEmails = this.withoutUserOnTeam ? [] : [this.currentUser.email];
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				this.repo = response.repo;
				this.team = response.team;
				this.users = response.users;
				callback();
			},
			{
				withEmails: withEmails,	// include current user as needed
				withRandomEmails: 1,	// another user for good measure
				token: this.otherUserData.accessToken	// the "other user" is the repo and team creator
			}
		);
	}

	// create the stream to be updated
	createRandomStream (callback) {
		let type = this.type || 'channel';
		this.streamFactory.createRandomStream(
			(error, response) => {
				if (error) { return callback(error); }
				this.stream = response.stream;
				this.expectedStream = DeepClone(this.stream);
				if (this.expectedStream.memberIds) {
					this.expectedStream.memberIds.push(this.currentUser._id);
				}
				this.path = '/join/' + this.stream._id;
				this.modifiedAfter = Date.now();
				callback();
			},
			{
				type: type,
				teamId: this.team._id, // create the stream in the team we already created
				repoId: type === 'file' ? this.repo._id : undefined, // file-type streams must have repoId
				token: this.otherUserData.accessToken, // the "other user" is the stream creator
				isTeamStream: this.isTeamStream,	// create a "team-stream" as needed,
				privacy: this.streamPrivacy	
			}
		);
	}
}

module.exports = CommonInit;
