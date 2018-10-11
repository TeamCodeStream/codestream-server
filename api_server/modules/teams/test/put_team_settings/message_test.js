'use strict';

const CodeStreamMessageTest = require(process.env.CS_API_TOP + '/modules/messager/test/codestream_message_test');
const ComplexUpdate = require('./complex_update');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class MessageTest extends CodeStreamMessageTest {

	get description () {
		return 'team members should receive a message on the team channel when the team settings are updated';
	}

	// make some test data before running the test
	makeData (callback) {
		BoundAsync.series(this, [
			super.makeData,
			this.preSetSettings
		], callback);
	}

	// preset the team's settings with initial data
	preSetSettings (callback) {
		// set some complex settings data
		const data = ComplexUpdate.INITIAL_SETTINGS;
		this.doApiRequest(
			{
				method: 'put',
				path: '/team-settings/' + this.team._id,
				data: data,
				token: this.token
			},
			callback
		);
	}

	// set the channel name to listen on
	setChannelName (callback) {
		// setting changes should be sent on the team channel
		this.channelName = 'team-' + this.team._id;
		callback();
	}

	// do the request that triggers the message being sent
	generateMessage (callback) {
		// apply a complex update operation to the already "complex" settings
		// data, and confirm the appropriate complex op to apply at the client
		let data = ComplexUpdate.UPDATE_OP;
		this.doApiRequest(
			{
				method: 'put',
				path: '/team-settings/' + this.team._id,
				data: data,
				token: this.token
			},
			error => {
				if (error) { return callback(error); }
				this.message = {
					team: {
						_id: this.team._id
					}
				};
				Object.assign(this.message.team, ComplexUpdate.EXPECTED_OP);
				this.message.team.$set.version = 5;
				this.message.team.$version = {
					before: 4,
					after: 5
				};
				callback();
			}
		);
	}
}

module.exports = MessageTest;
