'use strict';

var CodeStreamMessageTest = require('./codestream_message_test');
var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');

class PresenceLeaveTest extends CodeStreamMessageTest {

	constructor (options) {
		super(options);
		this.withPresence = true;	// necessary to get presence messages
	}

	get description () {
		return `members of the team should get a "leave" presence message when another user unsubscribes from the ${this.which} channel`;
	}

	// make the data needed to prepare for the request that triggers the message
	makeData (callback) {
		BoundAsync.series(this, [
			this.createOtherUser,	// create a second registered user
			this.createRepo,		// create a repo with me and the other user
			this.wait,				// wait for permissions to be set
			this.subscribe,			// first subscribe so we can unsubscribe
			this.waitForDebounce,	// wait for presence debounce interval, defaults to 2 seconds
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

	// subscribe the other user to the team channel, before unsubscribing
	subscribe (callback) {
		this.channelName = this.myChannelName();
		let otherUser = this.otherUserData.user;
		let token = this.otherUserData.accessToken;
		this.makePubnubForClient(token, otherUser);
		this.pubnubClientsForUser[otherUser._id].subscribe(
			this.channelName,
			() => {},
			callback,
			{
				includePresence: this.withPresence
			}
		);
	}

	// what is my channel name? depends on the test
	myChannelName () {
		return `${this.which}-${this[this.which]._id}`;
	}

	// wait for presence debounce interval, defaults to 2 seconds
	waitForDebounce (callback) {
		setTimeout(callback, 3000);
	}

	// set the channel name to listen on
	setChannelName (callback) {
		// we've already set the channel name
		callback();
	}

	// generate the message that triggers the test
	generateMessage (callback) {
		// have the "other" user unsubscribe from the team channel, the current user
		// should receive a "leave" presence message
		let otherUser = this.otherUserData.user;
		this.pubnubClientsForUser[otherUser._id].unsubscribe(this.channelName);
		callback();
	}

	// validate the received message against expectations
	validateMessage (message) {
		let otherUser = this.otherUserData.user;
		if (message.action === 'leave' && message.uuid === otherUser._id) {
			return true;
		}
	}
}

module.exports = PresenceLeaveTest;
