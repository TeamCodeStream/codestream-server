// serves as the base class for other email notification tests

'use strict';

const Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');
const CommonInit = require('./common_init');
const CodeStreamMessageTest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/broadcaster/test/codestream_message_test');
const Assert = require('assert');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');

class EmailNotificationTest extends Aggregation(CodeStreamMessageTest, CommonInit) {

	get description () {
		return 'should send a notification email to the assignee when a user is assigned to a New Relic object';
	}

	// make the data that triggers the message to be received
	makeData (callback) {
		this.testEmailNotification = true;
		this.init(callback);
	}

	makeNRRequestData (callback) {
		// make the assigner the current user just so we can listen for the email message on their me-channel
		super.makeNRRequestData(error => {
			if (error) { return callback(error); }
			this.data.creator.email = this.currentUser.user.email;
			callback();
		});
	}

	// set the channel name to listen for the email message on
	setChannelName (callback) {
		// for the user who is assigning, we use their me-channel
		// we'll be sending the data that we would otherwise send to the outbound email
		// service on this channel, and then we'll validate the data
		this.channelName = `user-${this.currentUser.user.id}`;
		callback();
	}

	// generate the message that starts the test
	generateMessage (callback) {
		// expect to receive this message
		this.createNRAssignment(callback);
	}

	validateMessage (message) {
		this.message = {
			type: 'nr_error_group_assignment',
			codeErrorId: this.nrAssignmentResponse.codeStreamResponse.codeError.id,
			assignee: this.nrAssignmentResponse.codeStreamResponse.assigneeId,
			traceHeaders: message.message.traceHeaders // shameless copy, we don't care about contents
		};
		return super.validateMessage(message);
	}
}

module.exports = EmailNotificationTest;
