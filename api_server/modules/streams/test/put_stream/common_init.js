// base class for many tests of the "PUT /streams" requests

'use strict';

const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const DeepClone = require(process.env.CS_API_TOP + '/server_utils/deep_clone');

class CommonInit {

	init (callback) {
		BoundAsync.series(this, [
			this.createOtherUser,	// create another registered user
			this.createAddedUser,	// create another user, this user will be added to the stream as needed
			this.createRandomRepo,	// create a random repo (and team) for the test
			this.createRandomStream,	// create the stream that will then be updated
			this.makeStreamData		// make the data to be used during the update
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

	// create another registered user, who will be added to the stream as needed
	createAddedUser (callback) {
		this.userFactory.createRandomUser(
			(error, response) => {
				if (error) { return callback(error); }
				this.addedUserData = response;
				callback();
			}
		);
	}

	// create a random repo to use for the test
	createRandomRepo (callback) {
		let withEmails = this.withoutUserOnTeam ? [] : [this.currentUser.email];
		withEmails.push(this.addedUserData.user.email);
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
				withRandomEmails: 3,	// another user for good measure
				token: this.otherUserData.accessToken	// the "other user" is the repo and team creator
			}
		);
	}

	// create the stream to be updated
	createRandomStream (callback) {
		let type = this.type || 'channel';
		let memberIds = (this.type === 'file' || this.isTeamStream) ? undefined : 
			(this.withoutUserInStream || this.withoutUserOnTeam) ? undefined : [this.currentUser._id];
		if (this.everyoneInStream) {
			const otherMemberIds = this.users.filter(user => {
				return user._id !== this.currentUser._id && user._id !== this.otherUserData.user._id;
			}).map(user => user._id);
			memberIds = [...memberIds, ...otherMemberIds];
		}
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
				token: this.otherUserData.accessToken, // the "other user" is the stream creator
				isTeamStream: this.isTeamStream,	// create a "team-stream" as needed,
				privacy: this.streamPrivacy	
			}
		);
	}

	// get the data for the stream update
	getUpdateData () {
		return {
			name: this.streamFactory.randomName(),
			purpose: this.streamFactory.randomPurpose()
		};
	}

	// form the data for the stream update
	makeStreamData (callback) {
		this.data = this.getUpdateData();
		this.expectedStream = DeepClone(this.stream);
		Object.assign(this.expectedStream, this.data);
		this.path = '/streams/' + this.stream._id;
		this.modifiedAfter = Date.now();
		callback();
	}
}

module.exports = CommonInit;
