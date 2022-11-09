'use strict';

const Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');
const CodeStreamMessageTest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/broadcaster/test/codestream_message_test');
const CommonInit = require('./common_init');

class MessageToUserTest extends Aggregation(CodeStreamMessageTest, CommonInit) {

	get description () {
		return 'when a user declines an invite to a company, registered users with matching emails should get a message with updated eligible join companies';
	}

	// make the data that triggers the message to be received
	makeData (callback) {
		super.init(error => {
			if (error) { return callback(error); }
			this.createOtherCompany(callback);
		});
	}

	// create another company, the user record created as a result of creating this company
	// gives us a user ID to listen on for the message
	createOtherCompany (callback) {
		this.companyFactory.createRandomCompany(
			(error, response) => {
				if (error) { return callback(error); }
				this.otherCompanyResponse = response;
				this.expectedEligibleJoinCompanies = [{
					accessToken: this.currentUser.accessToken,
					byInvite: true,
					id: response.company.id,
					teamId: response.company.everyoneTeamId,
					memberCount: 1,
					name: response.company.name
				}];
				callback();
			},
			{
				token: this.currentUser.accessToken
			}
		);
	}

	// set the name of the channel we expect to receive a message on
	setChannelName (callback) {
		// expect on the user's me-channel 
		this.channelName = `user-${this.currentUser.user.id}`;
		callback();
	}

	// generate the message by issuing a request
	generateMessage (callback) {
		// decline the invite, which will trigger the message
		this.declineInvite(callback);
	}

	validateMessage (message) {
		this.message = {
			user: {
				id: this.currentUser.user.id,
				$set: {
					eligibleJoinCompanies: this.expectedEligibleJoinCompanies
				},
				$version: {
					before: '*'
				}
			}
		};

		message.message.user.$set.eligibleJoinCompanies.sort((a, b) => {
			return a.id.localeCompare(b.id);
		});
		this.message.user.$set.eligibleJoinCompanies.sort((a, b) => {
			return a.id.localeCompare(b.id);
		});

		return super.validateMessage(message);
	}
}

module.exports = MessageToUserTest;
