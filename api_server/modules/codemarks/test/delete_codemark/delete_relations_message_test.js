'use strict';

const Aggregation = require(process.env.CS_API_TOP + '/server_utils/aggregation');
const CodeStreamMessageTest = require(process.env.CS_API_TOP + '/modules/broadcaster/test/codestream_message_test');
const CommonInit = require('./common_init');

class MessageTest extends Aggregation(CodeStreamMessageTest, CommonInit) {

	constructor (options) {
		super(options);
		this.wantRelatedCodemarks = true;
	}
	
	get description () {
		const type = this.streamType === 'team stream' ? 'team' : this.streamType;
		return `members of the team should receive a message with the unrelated codemarks when a codemark linked to other codemarks is deleted in a ${type} stream`;
	}

	// make the data that triggers the message to be received
	makeData (callback) {
		this.init(callback);
	}

	// set the name of the channel we expect to receive a message on
	setChannelName (callback) {
		this.channelName = `team-${this.team.id}`;
		callback();
	}

	// generate the message by issuing a request
	generateMessage (callback) {
		// do the delete, this should trigger a message to the team channel
		// with the deleted codemark
		this.deleteCodemark(callback);
	}

	deleteCodemark (callback) {
		super.deleteCodemark(error => {
			if (error) { return callback(error); }
			if (this.streamType !== 'team stream') {
				// for streams, the message received on the team channel should be limited to the codemarks affected 
				const relatedCodemarkIds = this.relatedCodemarks.map(relatedCodemark => relatedCodemark.id);
				const expectedCodemarks = this.message.codemarks.filter(codemark => relatedCodemarkIds.includes(codemark.id));
				this.message = {
					codemarks: expectedCodemarks
				};
			}
			callback();
		});
	}
}

module.exports = MessageTest;
