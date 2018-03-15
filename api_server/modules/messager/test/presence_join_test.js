'use strict';

var CodeStreamMessageTest = require('./codestream_message_test');
var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class PresenceJoinTest extends CodeStreamMessageTest {

	constructor (options) {
		super(options);
		this.withPresence = true;	// necessary to get presence messages
	}

	get description () {
		return `members of the team should get a "join" presence message when another user subscribes to the ${this.which} channel`;
	}

	// make the data needed to prepare for the request that triggers the message
	makeData (callback) {
		BoundAsync.series(this, [
			this.createOtherUser,	// create a second registered user
			this.createRepo			// create a repo with me and the other user
		], callback);
	}

	// create another user who will be on the team with me
	createOtherUser (callback) {
		this.userFactory.createRandomUser(
			(error, response) => {
				if (error) { return callback(error); }
				this.otherUserData = response;
				callback();
			}
		);
	}

	// create a random repo
	createRepo (callback) {
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				this.team = response.team;
				this.repo = response.repo;
				this.users = response.users;
				callback();
			},
			{
				withEmails: [this.otherUserData.user.email], 	// add the "other" user
				withRandomEmails: 2,	// add a few random users
				token: this.token		// i am the creator
			}
		);
	}

	// set the channel name to listen on
	setChannelName (callback) {
		// we'll listen on the team channel for the presence message
		this.channelName = this.myChannelName();
		callback();
	}

	// what is my channel name? depends on the test
	myChannelName () {
		return `${this.which}-${this[this.which]._id}`;
	}

	// generate the message that triggers the test
	generateMessage (callback) {
		// have the "other" user subscribe to the team channel, the current user
		// should receive a "join" presence message
		let otherUser = this.otherUserData.user;
		let token = this.otherUserData.accessToken;
		this.makePubnubForClient(token, otherUser);
		this.pubnubClientsForUser[otherUser._id].subscribe(
			this.channelName,
			() => {},
			callback,
			{
				withPresence: this.withPresence
			}
		);
	}

	// validate the received message against expectations
	validateMessage (message) {
		let otherUser = this.otherUserData.user;
		if (message.action === 'join' && message.uuid === otherUser._pubnubUuid) {
			return true;
		}
	}
}

module.exports = PresenceJoinTest;
