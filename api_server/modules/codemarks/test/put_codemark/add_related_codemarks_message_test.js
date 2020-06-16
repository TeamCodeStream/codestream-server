'use strict';

const Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');
const CodeStreamMessageTest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/broadcaster/test/codestream_message_test');
const CommonInit = require('./common_init');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');

class AddRelatedCodemarksMessageTest extends Aggregation(CodeStreamMessageTest, CommonInit) {

	constructor (options) {
		super(options);
		this.goPostless = true;
		this.wantRelatedCodemarks = true;
	}

	get description () {
		return `members of the team or stream should receive a message with the codemark and updates to related codemarks when a codemark is updated in a ${this.streamType} stream, and related codemarks are added`;
	}

	// make the data that triggers the message to be received
	makeData (callback) {
		this.init(callback);
	}

	// override making the postless codemark, to create some codemarks first, and then relate those,
	// so they are "pre-related" to the codemark when we do the test
	makePostlessCodemark (callback) {
		this.data = { relatedCodemarkIds: [] };
		BoundAsync.series(this, [
			this.createRelatedCodemarks,
			super.makePostlessCodemark
		], callback);
	}

	// add the codemarks we have already created to the list of related codemarks for the test codemark to be created
	getPostlessCodemarkData () {
		const data = super.getPostlessCodemarkData();
		data.relatedCodemarkIds = this.prerelatedCodemarkIds = this.data.relatedCodemarkIds;
		return data;
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

module.exports = AddRelatedCodemarksMessageTest;
