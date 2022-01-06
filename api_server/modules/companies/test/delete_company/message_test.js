'use strict';

const Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');
const CodeStreamMessageTest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/broadcaster/test/codestream_message_test');
const CommonInit = require('./common_init');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');

class MessageTest extends Aggregation(CodeStreamMessageTest, CommonInit) {

	get description () {
		return 'members of the team should receive a message with the deactivated team when a company is deleted';
	}

	// make the data that triggers the message to be received
	makeData (callback) {
		BoundAsync.series(this, [
			this.init,
			this.createSecondCompany,
			this.setExpectedMessage
		], callback);
	}

	// we create a second company so that when we delete the first company,
	// our user isn't orphaned
	createSecondCompany (callback) {
		this.companyFactory.createRandomCompany(
			(error, response) => {
				if (error) { return callback(error); }
				this.secondTeam = response.team;
				this.secondCompany = response.company;
				this.secondTeamStream = response.streams[0];
				callback();
			},
			{
				token: this.token
			}
		);
	}

	setExpectedMessage (callback) {
		this.message = {
			user: {
				_id: this.currentUser.user.id,	// DEPRECATE ME
				id: this.currentUser.user.id,
				$pull: {
					companyIds: this.company.id,
					teamIds: this.team.id
				},
				$set: {
					version: 7,
					modifiedAt: Date.now() // placeholder
				},
				$version: {
					before: 6,
					after: 7
				}
			}
		};
		callback();
	}

	// set the name of the channel we expect to receive a message on
	setChannelName (callback) {
		// we just check one user channel for simplicity
		this.channelName = `user-${this.currentUser.user.id}`;
		callback();
	}

	// generate the message by issuing a request
	generateMessage (callback) {
		// do the delete, this should trigger a message to the
		// user channel with the updated company
		this.deleteCompany(callback);
	}

	validateMessage (message) {
		// we don't get this value any other way
		this.message.user.$set.modifiedAt = message.message.user.$set.modifiedAt;
		return super.validateMessage(message);
	}
}

module.exports = MessageTest;