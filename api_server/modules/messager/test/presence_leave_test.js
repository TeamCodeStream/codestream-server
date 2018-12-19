'use strict';

const CodeStreamMessageTest = require('./codestream_message_test');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class PresenceLeaveTest extends CodeStreamMessageTest {

	constructor (options) {
		super(options);
		this.withPresence = true;	// necessary to get presence messages
	}

	get description () {
		return 'members of the team should get a "leave" presence message when another user unsubscribes from the team channel';
	}

	// make the data needed to prepare for the request that triggers the message
	makeData (callback) {
		BoundAsync.series(this, [
			this.wait,				// wait for permissions to be set
			this.subscribe,			// first subscribe so we can unsubscribe
			this.waitForDebounce,	// wait for presence debounce interval, defaults to 2 seconds
		], callback);
	}

	// subscribe the other user to the team channel, before unsubscribing
	subscribe (callback) {
		this.channelName = 'team-' + this.team.id;
		const otherUser = this.users[1].user;
		const token = this.users[1].pubnubToken;
		this.makePubnubForClient(token, otherUser);
		this.pubnubClientsForUser[otherUser.id].subscribe(
			this.channelName,
			() => {},
			callback,
			{
				includePresence: this.withPresence
			}
		);
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
		const otherUser = this.users[1].user;
		this.pubnubClientsForUser[otherUser.id].unsubscribe(this.channelName);
		callback();
	}

	// validate the received message against expectations
	validateMessage (message) {
		const otherUser = this.users[1].user;
		if (message.action === 'leave' && message.uuid === otherUser._pubnubUuid) {
			return true;
		}
	}
}

module.exports = PresenceLeaveTest;
