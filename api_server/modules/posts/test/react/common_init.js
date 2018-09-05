// base class for many tests of the "PUT /react/:id" requests

'use strict';

const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const RandomString = require('randomstring');

class CommonInit {

	init (callback) {
		BoundAsync.series(this, [
			this.createTeamCreator,	// create a user who will create a team
			this.createTeam,		// user creates a team
			this.inviteCurrentUser,	// invite the current user to the team
			this.addOtherUsers,		// create a few more registered users, and invite them to the team
			this.createRandomStream,	// create a stream in that team
			this.createPost,        // create the post that will then be reacted to
			this.makePostData		// make the data to be used during the update
		], callback);
	}

	// create a user who will create a team
	createTeamCreator (callback) {
		this.userFactory.createRandomUser(
			(error, response) => {
				if (error) { return callback(error); }
				this.teamCreatorData = response;
				callback();
			}
		);
	}

	// create a random team
	createTeam (callback) {
		this.teamFactory.createRandomTeam(
			(error, response) => {
				if (error) { return callback(error); }
				this.team = response.team;
				this.teamStream = response.streams[0];
				callback();
			},
			{
				token: this.teamCreatorData.accessToken
			}
		);
	}

	// invite the current user to the team, as needed
	inviteCurrentUser (callback) {
		if (this.withoutUserOnTeam) {
			return callback();
		}
		this.doApiRequest(
			{
				method: 'post',
				path: '/users',
				data: {
					email: this.currentUser.email,
					teamId: this.team._id
				},
				token: this.teamCreatorData.accessToken
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.currentUser = response.user;
				callback();
			}
		);
	}

	// create a few more registered users, and invite them to the team
	addOtherUsers (callback) {
		this.otherUserData = [];
		BoundAsync.timesSeries(
			this,
			3,
			this.addOtherUser,
			callback
		);
	}

	// create another registered user (in addition to the "current" user),
	// and invite to the current team
	addOtherUser (n, callback) {
		BoundAsync.series(this, [
			seriesCallback => {
				this.createOtherUser(n, seriesCallback);
			},
			seriesCallback => {
				this.inviteOtherUser(n, seriesCallback);
			}
		], callback);
	}

	// create another registered user
	createOtherUser (n, callback) {
		this.userFactory.createRandomUser(
			(error, response) => {
				if (error) { return callback(error); }
				this.otherUserData[n] = response;
				callback();
			}
		);
	}

	// invite a user we created to the current team
	inviteOtherUser (n, callback) {
		this.doApiRequest(
			{
				method: 'post',
				path: '/users',
				data: {
					email: this.otherUserData[n].user.email,
					teamId: this.team._id
				},
				token: this.teamCreatorData.accessToken
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.otherUserData[n].user = response.user;
				callback();
			}
		);
	}

	// create a random channel stream to use for the test
	createRandomStream (callback) {
		const memberIds = this.otherUserData.map(userData => userData.user._id);
		if (!this.withoutUserInStream) {
			memberIds.push(this.currentUser._id);
		}
		this.streamFactory.createRandomStream(
			(error, response) => {
				if (error) { return callback(error); }
				this.stream = response.stream;
				callback();
			},
			{
				type: this.streamType || 'channel',
				teamId: this.team._id, 
				memberIds, 
				token: this.teamCreatorData.accessToken // have the user who created the team also create the stream
			}
		);
	}

	// create the post to be updated
	createPost (callback) {
		const streamId = this.useTeamStream ? this.teamStream._id : this.stream._id;
		this.postFactory.createRandomPost(
			(error, response) => {
				if (error) { return callback(error); }
				this.post = response.post;
				callback();
			},
			{
				token: this.teamCreatorData.accessToken,   // have the user who created the team also create the post
				streamId 
			}
		);
	}

	// form the data for the reaction
	makePostData (callback) {
		this.reaction = RandomString.generate(8);
		this.data = {
			[this.reaction]: true
		};
		this.expectedData = {
			post: {
				_id: this.post._id,
				$addToSet: {
					[`reactions.${this.reaction}`]: this.currentUser._id
				}
			}
		};
		this.path = '/react/' + this.post._id;
		callback();
	}
}

module.exports = CommonInit;
