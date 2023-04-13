'use strict';

const Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');
const CodeStreamMessageTest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/broadcaster/test/codestream_message_test');
const CommonInit = require('./common_init');
const Assert = require('assert');

class ChangeOrgNameMessageTest extends Aggregation(CodeStreamMessageTest, CommonInit) {

	get description () {
		return 'members of the team should receive a message with the changes to an org name when a name change is discovered through IDP';
	}

	// make the data that triggers the message to be received
	makeData (callback) {
		this.delayLogin = true;
		this.init(callback);
	}

	// set mock data to use during the test
	makeMockData (callback) {
		this.testOrg = true;
		this.path = '/companies/' + this.company.id;
		this.data = {
			name: this.companyFactory.randomName()
		};
		const expectedVersion = 2;
		this.message = {
			company: {
				id: this.company.id,
				$set: {
					name: this.data.name,
					modifiedAt: Date.now(), //placeholder
					version: expectedVersion
				},
				$version: {
					before: expectedVersion - 1,
					after: expectedVersion
				}
			}
		};
		super.makeMockData(callback);
	}

	// set the name of the channel we expect to receive a message on
	setChannelName (callback) {
		this.channelName = `team-${this.team.id}`;
		callback();
	}

	// generate the message by issuing a request
	generateMessage (callback) {
		this.testRunAt = Date.now();
		this.delayLogin = false;
		this.doLogin(callback);
	}

	validateMessage (message) {
		Assert(message.message.company.$set.modifiedAt >= this.testRunAt, 'modifiedAt not greater than or equal to when the test was run');
		this.message.company.$set.modifiedAt = message.message.company.$set.modifiedAt;
		return super.validateMessage(message);
	}
}

module.exports = ChangeOrgNameMessageTest;
