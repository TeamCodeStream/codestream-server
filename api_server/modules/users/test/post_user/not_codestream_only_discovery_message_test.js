'use strict';

const Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');
const CodeStreamMessageTest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/broadcaster/test/codestream_message_test');
const CommonInit = require('./common_init');

class NotCodeStreamOnlyDiscoveryMessageTest extends Aggregation(CodeStreamMessageTest, CommonInit) {

	get description () {
		return `members of the team should receive a message with the a company update when an attempt is made to invite a user to an org that is discovered to be no longer codestream-only`;
	}

	// make the data that triggers the message to be received
	makeData (callback) {
		this.init(callback);
	}

	// set the name of the channel we expect to receive a message on
	setChannelName (callback) {
		// it is the team channel
		this.channelName = 'team-' + this.team.id;
		callback();
	}

	// generate the message by issuing a request
	generateMessage (callback) {
		// add header to the test request to mock a response from NR that indicates the org
		// is no longer codestream-only
		this.updatedAt = Date.now();
		const expectedVersion = 2;
		this.message = {
			company: {
				_id: this.company.id, // DEPRECATE ME
				id: this.company.id,
				$set: {
					codestreamOnly: false,
					version: expectedVersion
				},
				$unset: {
					domainJoining: true
				},
				$version: {
					before: expectedVersion - 1,
					after: expectedVersion
				}
			}
		};
		this.doApiRequest(
			{
				method: 'post',
				path: '/users',
				data: this.data,
				token: this.token,
				requestOptions: {
					headers: {
						'x-cs-mock-no-cs-only': true
					}
				}
			},
			error => {
				// we actually expect this to fail
				if (!error) {
					throw new Error('error not returned to PUT /companies when triggering not CS-only');
				}
				callback();
			}
		);
	}
}

module.exports = NotCodeStreamOnlyDiscoveryMessageTest;
