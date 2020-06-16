'use strict';

const Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');
const CodeStreamMessageTest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/broadcaster/test/codestream_message_test');
const CommonInit = require('../common_init');
const Assert = require('assert');

class NumUsersInvitedTest extends Aggregation(CodeStreamMessageTest, CommonInit) {

	constructor (options) {
		super(options);
		this.streamOptions.isTeamStream = true;
	}

	get description () {
		return 'the inviting user should get numUsersInvited incremented when inviting a user to the team via a post created with a codemark with an on-the-fly invite';
	}

	// make the data that triggers the message to be received
	makeData (callback) {
		this.init(callback);
	}

	// form the data we'll use in creating the post
	makePostData (callback) {
		super.makePostData(() => {
			this.data.addedUsers = [
				this.userFactory.randomEmail(),
				this.userFactory.randomEmail()
			];
			callback();
		});
	}

	// set the name of the channel we expect to receive a message on
	setChannelName (callback) {
		// it is the team channel
		this.channelName = 'user-' + this.currentUser.user.id;
		callback();
	}

	// generate the message by issuing a request
	generateMessage (callback) {
		// do the update, this should trigger a message to the user channel 
		this.postCreatedAfter = Date.now();
		this.doApiRequest(
			{
				method: 'post',
				path: '/posts',
				data: this.data,
				token: this.token
			},
			error => {
				if (error) { return callback(error); }
				this.message = {
					user: {
						_id: this.currentUser.user.id, // DEPRECATE ME
						id: this.currentUser.user.id,
						$set: {
							numUsersInvited: 2,
							lastPostCreatedAt: Date.now(), // placeholder
							totalPosts: 1,
							version: 4,
							modifiedAt: Date.now() // placeholder
						},
						$unset: {
							[`lastReads.${this.stream.id}`]: true
						},
						$version: {
							before: 3,
							after: 4
						}
					}
				};
				callback();
			}
		);
	}

	validateMessage (message) {
		if (!message.message.user.$set.numUsersInvited) {
			return false;
		}
		Assert(message.message.user.$set.modifiedAt >= this.postCreatedAfter, 'modifiedAt not changed');
		this.message.user.$set.modifiedAt = message.message.user.$set.modifiedAt;
		Assert(message.message.user.$set.lastPostCreatedAt >= this.postCreatedAfter, 'modifiedAt not changed');
		this.message.user.$set.lastPostCreatedAt = message.message.user.$set.lastPostCreatedAt;
		return super.validateMessage(message);
	}
}

module.exports = NumUsersInvitedTest;
