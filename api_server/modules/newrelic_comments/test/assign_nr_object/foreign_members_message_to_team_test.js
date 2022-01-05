'use strict';

const Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');
const CommonInit = require('./common_init');
const CodeStreamMessageTest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/broadcaster/test/codestream_message_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const Assert = require('assert');

class ForeignMembersMessageToTeamTest extends Aggregation(CodeStreamMessageTest, CommonInit) {

	get description () {
		return 'members of the team that owns a code error should receive a message with foreign members added when a user is assigned to the code error';
	}

	// make the data that triggers the message to be received
	makeData (callback) {
		this.init(callback);
	}

	setTestOptions (callback) {
		// create an existing code error object
		super.setTestOptions(() => {
			Object.assign(this.postOptions, {
				numPosts: 1,
				creatorIndex: 0,
				wantCodeError: true
			});
			callback();
		});
	}

	makeNRRequestData (callback) {
		// use the existing code error object instead of a new one
		super.makeNRRequestData(error => {
			if (error) { return callback(error); }
			const codeError = this.postData[0].codeError;
			Object.assign(this.data, {
				objectId: codeError.objectId,
				accountId: codeError.accountId
			});
			this.apiRequestOptions.headers['X-CS-NewRelic-AccountId'] = codeError.accountId;
			callback();
		});
	}
	
	// set the name of the channel we expect to receive a message on
	setChannelName (callback) {
		// when posted to a team stream, it is the team channel
		this.channelName = `team-${this.team.id}`;
		callback();
	}

	// generate the message by issuing a request
	generateMessage (callback) {
		this.createNRAssignment(callback);
	}

	validateMessage (message) {
		if (!message.message.team) {
			return false;
		}

		// make sure modifiedAt was updated
		Assert(message.message.team.$set.modifiedAt >= this.createdAfter, 'modifiedAt for team update was not set to after the assignment was made');

		// fetch the users indicated in the foreignMemberIds array, and ensure those users match
		// the emails passed in with the test request
		const foreignMemberIds = message.message.team.$addToSet.foreignMemberIds;
		this.doApiRequest(
			{
				method: 'get',
				path: `/users?teamId=${this.team.id}&ids=${foreignMemberIds.join(',')}`,
				token: this.token,
			},
			(error, response) => {
				if (error) { return this.messageCallback(error); }
				Assert.strictEqual(response.users.length, 2, `2 users should have been returned`);
				['creator', 'assignee'].forEach(userType => {
					const user = response.users.find(u => {
						return u.email === this.requestData[userType].email;
					});
					Assert(user, `${userType} not found among the returned users`);
				});

				this.message = {
					team: {
						id: this.team.id,
						_id: this.team.id, // DEPRECATE ME
						$addToSet: {
							foreignMemberIds,
							memberIds: [...foreignMemberIds]
						},
						$set: {
							version: 4,
							modifiedAt: message.message.team.$set.modifiedAt
						},
						$version: {
							before: 3,
							after: 4
						}
					}
				};

				// final validation is to make sure the message exactly matches
				if (super.validateMessage(message) && this.messageCallback) {
					this.messageCallback();
				}
			}
		);

		// by not returning true here, we make the test code wait until we call messageCallback,
		// through the call to super.validateMessage(), above
	}
}

module.exports = ForeignMembersMessageToTeamTest;
