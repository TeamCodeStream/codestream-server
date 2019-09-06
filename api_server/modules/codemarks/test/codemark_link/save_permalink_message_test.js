'use strict';

const Aggregation = require(process.env.CS_API_TOP + '/server_utils/aggregation');
const CodeStreamMessageTest = require(process.env.CS_API_TOP + '/modules/broadcaster/test/codestream_message_test');
const CommonInit = require('./common_init');
const Assert = require('assert');

class SavePermalinkMessageTest extends Aggregation(CodeStreamMessageTest, CommonInit) {

	constructor (options) {
		super(options);
		this.dontCreatePermalink = true;
	}

	get description () {
		return 'when creating a codemark link for a legacy codemark that does not have a permalink, team members should receive a message with the permalink set for the codemark ';
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

	// generate the message by issuing a request to relate the codemarks
	generateMessage (callback) {
		this.modifiedAfter = Date.now();
		this.doApiRequest(
			{
				method: 'post',
				path: `/codemarks/${this.codemark.id}/permalink`,
				token: this.token
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.message = {
					codemark: {
						id: this.codemark.id,
						_id: this.codemark.id,	// DEPRECATE ME
						$set: {
							version: 2,
							modifiedAt: Date.now(),	// placeholder
							permalink: response.permalink
						},
						$version: {
							before: 1,
							after: 2
						}
					}
				};
				callback();
			}
		);
	}

	// validate the incoming message
	validateMessage (message) {
		Assert(message.message.codemark.$set.modifiedAt >= this.modifiedAfter, 'modifiedAt not changed');
		this.message.codemark.$set.modifiedAt = message.message.codemark.$set.modifiedAt;
		return super.validateMessage(message);
	}
}

module.exports = SavePermalinkMessageTest;
