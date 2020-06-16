'use strict';

const CodeStreamMessageTest = require(process.env.CS_API_TOP + '/modules/broadcaster/test/codestream_message_test');
const ComplexUpdate = require('./complex_update');
const Assert = require('assert');

class MessageTest extends CodeStreamMessageTest {

	constructor (options) {
		super(options);
		this.userOptions.numRegistered = 1;
		delete this.teamOptions.creatorIndex;
		this.expectVersion = 2;
	}

	get description () {
		return 'the user should receive a message on their me-channel when they update their preferences';
	}

	// make some test data before running the test
	makeData (callback) {
		// set some complex preferences data
		const data = ComplexUpdate.INITIAL_PREFERENCES;
		this.expectVersion++;
		this.doApiRequest(
			{
				method: 'put',
				path: '/preferences',
				data: data,
				token: this.token
			},
			callback
		);
	}

	// set the channel name to listen on
	setChannelName (callback) {
		// preference changes come back to the user on their own me-channel
		this.channelName = 'user-' + this.currentUser.user.id;
		callback();
	}

	// do the request that triggers the message being sent
	generateMessage (callback) {
		// apply a complex update operation to the already "complex" preferences
		// data, and confirm the appropriate complex op to apply at the client
		const data = ComplexUpdate.UPDATE_OP;
		this.expectVersion++;
		this.updatedAt = Date.now();
		this.doApiRequest(
			{
				method: 'put',
				path: '/preferences',
				data: data,
				token: this.token
			},
			error => {
				if (error) { return callback(error); }
				this.message = {
					user: {
						_id: this.currentUser.user.id,	// DEPRECATE ME
						id: this.currentUser.user.id
					}
				};
				this.message = this.getBaseExpectedResponse();
				Object.assign(this.message.user.$set, ComplexUpdate.EXPECTED_OP.$set);
				this.message.user.$unset = Object.assign({}, ComplexUpdate.EXPECTED_OP.$unset);
				callback();
			}
		);
	}

	getBaseExpectedResponse () {
		return {
			user: {
				_id: this.currentUser.user.id,	// DEPRECATE ME
				id: this.currentUser.user.id,
				$set: {
					version: this.expectVersion
				},
				$version: {
					before: this.expectVersion - 1,
					after: this.expectVersion
				}
			}
		};
	}

	validateMessage (message) {
		Assert(message.message.user.$set.modifiedAt >= this.updatedAt, 'modifiedAt not changed');
		this.message.user.$set.modifiedAt = message.message.user.$set.modifiedAt;
		return super.validateMessage(message);
	}
}

module.exports = MessageTest;
