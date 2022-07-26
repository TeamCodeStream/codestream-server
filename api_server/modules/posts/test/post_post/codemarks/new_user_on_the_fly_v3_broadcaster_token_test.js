'use strict';

const Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');
const CodeStreamMessageTest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/broadcaster/test/codestream_message_test');
const Assert = require('assert');
const NewUserRegisteredTest = require('./new_user_registered_test');

class NewUserOnTheFlyV3BroadcasterTokenTest extends Aggregation(NewUserRegisteredTest, CodeStreamMessageTest) {

	constructor (options) {
		super(options);
		this.reallySendMessages = true;	// we suppress messages ordinarily, but since we're actually testing them...
	}

	get description () {
		return 'user should receive a message with a new V3 PubNub Access Manager broadcaster token when they are a registered user added to a team on the fly by being mentioned in a codemark';
	}

	makeData (callback) {
		this.init(error => {
			if (error) { return callback(error); }
			this.listeningUser = this.createdRegisteredUser;
			callback();
		});
	}

	// set the name of the channel we expect to receive a message on
	setChannelName (callback) {
		this.channelName = 'user-' + this.createdRegisteredUser.user.id;
		callback();
	}

	// generate the message by issuing a request
	generateMessage (callback) {
		this.doApiRequest(
			{
				method: 'post',
				path: '/posts',
				data: this.data,
				token: this.currentUser.accessToken
			},
			callback
		);
	}

	validateMessage (message) {
		if (!message.message.setBroadcasterV3Token) { return false; }
		Assert(typeof message.message.setBroadcasterV3Token === 'string');
		return true;
	}
}

module.exports = NewUserOnTheFlyV3BroadcasterTokenTest;
