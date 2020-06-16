'use strict';

const Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');
const CodeStreamMessageTest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/broadcaster/test/codestream_message_test');
const CommonInit = require('./common_init');

class RelatedCodemarksMessageTest extends Aggregation(CodeStreamMessageTest, CommonInit) {

	constructor (options) {
		super(options);
		this.wantRelatedCodemarks = true;
	}

	get description () {
		return `members of the team or stream should receive a message with the codemark and updates to related codemarks when a codemark is updated in a ${this.streamType} stream, and related to new codemarks`;
	}

	// make the data that triggers the message to be received
	makeData (callback) {
		this.init(callback);
	}

	// set the name of the channel we expect to receive a message on
	setChannelName (callback) {
		// for channels and directs the message comes on the stream channel
		if (this.goPostless || this.stream.isTeamStream) {
			this.channelName = `team-${this.team.id}`;
		}
		else {
			this.channelName = `stream-${this.stream.id}`;
		}
		callback();
	}

	// generate the message by issuing a request
	generateMessage (callback) {
		// do the update, this should trigger a message to the
		// stream channel with the updated post
		this.updateCodemark(callback);
	}
}

module.exports = RelatedCodemarksMessageTest;
