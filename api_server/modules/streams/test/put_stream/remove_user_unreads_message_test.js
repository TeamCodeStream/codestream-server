'use strict';

const Aggregation = require(process.env.CS_API_TOP + '/server_utils/aggregation');
const CodeStreamMessageTest = require(process.env.CS_API_TOP + '/modules/messager/test/codestream_message_test');
const RemoveUserTest = require('./remove_user_test');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const CommonInit = require('./common_init');

class RemoveUserUnreadsMessageTest extends Aggregation(CodeStreamMessageTest, CommonInit, RemoveUserTest) {

	get description () {
		return 'when a user is removed from a stream, that user should receive a message on their user change to clear the lastReads for that stream';
	}

	// make the data that triggers the message to be received
	makeData (callback) {
		BoundAsync.series(this, [
			this.init,
			this.createPost
		], callback);
	}

	// create a post in the test stream, which should set a lastReads value for this stream
	// for the current user
	createPost (callback) {
		this.postFactory.createRandomPost(
			callback,
			{
				streamId: this.stream._id,
				token: this.otherUserData.accessToken
			}
		);
	}

	// get array of users to remove from the stream
	getRemovedUsers () {
		return [this.currentUser];
	}

	// set the name of the channel we expect to receive a message on
	setChannelName (callback) {
		// lastReads is being updated for the individual user
		this.channelName = 'user-' + this.currentUser._id;
		callback();
	}

	// generate the message by issuing a request
	generateMessage (callback) {
		// do the update, this should trigger a message to the
		// stream channel with the updated stream
		this.doApiRequest(
			{
				method: this.method,
				path: this.path,
				data: this.data,
				token: this.token
			},
			error => {
				if (error) { return callback(error); }
				this.message = {
					user: {
						_id: this.currentUser._id,
						$unset: {
							[`lastReads.${this.stream._id}`]: true
						}
					}
				};
				callback();
			}
		);
	}
}

module.exports = RemoveUserUnreadsMessageTest;
