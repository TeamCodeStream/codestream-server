'use strict';

const Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');
const CodeStreamMessageTest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/broadcaster/test/codestream_message_test');
const CommonInit = require('./common_init');

class MessageToUserTest extends Aggregation(CodeStreamMessageTest, CommonInit) {

	constructor (options) {
		super(options);
		this.wantExistingUser = true;
		this.existingUserIsRegistered = true;
	}

	get description () {
		return 'when a user is invited to a company, registered users with matching emails should get a message with updated eligible join companies';
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
		this.listeningUserIndex = this.existingRegisteredUserIndex;
		const user = this.users[this.existingRegisteredUserIndex];
		this.companyFactory.createRandomCompany(
			(error, response) => {
				if (error) { return callback(error); }
				this.otherCompanyResponse = response;
				this.expectedEligibleJoinCompanies = [{
					accessToken: user.accessToken,
					byInvite: true,
					id: response.company.id,
					memberCount: 1,
					name: response.company.name
				}];
				callback();
			},
			{
				token: user.accessToken
			}
		);
	}

	// set the name of the channel we expect to receive a message on
	setChannelName (callback) {
		// expect on the user's me-channel 
		const user = this.users[this.existingRegisteredUserIndex].user;
		this.channelName = `user-${user.id}`;
		callback();
	}

	// generate the message by issuing a request
	generateMessage (callback) {
		// do the invite, which will trigger the message
		const user = this.users[this.existingRegisteredUserIndex].user;
		this.doApiRequest(
			{
				method: 'post',
				path: '/users',
				data: {
					email: user.email,
					teamId: this.team.id
				},
				token: this.token
			},
			callback
		);
	}

	validateMessage (message) {
		if (!message.message.user || !message.message.user.$set || !message.message.user.$set.eligibleJoinCompanies) {
			return false;
		}

		this.expectedEligibleJoinCompanies.push({
			byInvite: true,
			id: this.company.id,
			memberCount: 2,
			name: this.company.name
		});

		const user = this.users[this.existingRegisteredUserIndex].user;
		this.message = {
			user: {
				id: user.id,
				$set: {
					eligibleJoinCompanies: this.expectedEligibleJoinCompanies
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
