'use strict';

const CodeStreamMessageTest = require('./codestream_message_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');

class AddToExistingStreamTest extends CodeStreamMessageTest {

	constructor (options) {
		super(options);
		this.wantServer = true;	// want a simulated server to send a message
		this.userOptions.numRegistered = 2;
		Object.assign(this.streamOptions, {
			creatorIndex: 1,
			members: [2]
		});
	}

	get description () {
		return 'should be able to subscribe to and receive a message from the stream channel when i am added to a stream';
	}

	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.addUserToStream,
			this.wait
		], callback);
	}

	addUserToStream (callback) {
		if (this.mockMode && !this.usingSocketCluster) {
			return callback();
		}
		this.doApiRequest(
			{
				method: 'put',
				path: '/streams/' + this.stream.id,
				data: {
					$push: {
						memberIds: this.users[0].user.id
					}
				},
				token: this.users[1].accessToken
			},
			callback
		);
	}

	// set the channel name to listen on
	setChannelName (callback) {
		// we expect the message on the stream channel
		this.channelName = 'stream-' + this.stream.id;
		callback();
	}
}

module.exports = AddToExistingStreamTest;
