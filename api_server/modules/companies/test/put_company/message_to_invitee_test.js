'use strict';

const Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');
const CodeStreamMessageTest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/broadcaster/test/codestream_message_test');
const CommonInit = require('./common_init');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');

class MessageToInviteeTest extends Aggregation(CodeStreamMessageTest, CommonInit) {

	get description () {
		return 'users who are registered and have been invited to join a team should get a message on their user channel updating their eligibleJoinCompanies, when a company is changed';
	}

	setTestOptions (callback) {
		// don't yet the user to join the team
		this.listeningUserIndex = 1;
		this.teamOptions.members = []; 
		callback();
	}

	// make the data that triggers the message to be received
	makeData (callback) {
		BoundAsync.series(this, [
			this.init,
			this.createCompany, // invited user should be on another team
			this.inviteUser     // invite the (as of yet) uninvited user
		], callback);
	}

	// the second user should be in their own company, so that the invite spawns a new (unregistered) user record
	createCompany (callback) {
		this.companyFactory.createRandomCompany((error, response) => {
			if (error) { return callback(error);}
			this.createCompanyResponse = response;
			callback();
		}, { token: this.users[1].accessToken });
	}

	// test company creator now invites the second user to join team,
	// this spawns an "unregistered" record for the second user, but they should get the message on 
	// the channel for the original user record
	inviteUser (callback) {
		this.doApiRequest(
			{
				method: 'post',
				path: '/users',
				data: {
					email: this.users[1].user.email,
					teamId: this.team.id
				},
				token: this.token
			},
			callback
		);
	}

	// set the name of the channel we expect to receive a message on
	setChannelName (callback) {
		// expect on the "everyone" team channel
		this.channelName = `user-${this.users[1].user.id}`;
		callback();
	}

	// generate the message by issuing a request
	generateMessage (callback) {
		// we expect a message with eligibleJoinCompanies
		const createdCompany = this.createCompanyResponse.company;
		this.message = {
			user: {
				id: this.users[1].user.id,
				$set: {
					eligibleJoinCompanies: [
						// this is the original company the user created
						{
							id: createdCompany.id,
							name: createdCompany.name,
							teamId: createdCompany.everyoneTeamId,
							memberCount: 1,
							byInvite: true,
							accessToken: this.users[1].accessToken
						},
						// this is the company the user was just invited to, with name changed
						{
							id: this.company.id,
							name: this.data.name,
							teamId: this.team.id,
							memberCount: 1,
							byInvite: true
						}
					]					
				},
				$version: {
					before: '*'
				}
			}
		};

		// do the update, this should trigger a message to update eligibleJoinCompanies for the current user
		this.updateCompany(callback);
	}

	validateMessage (message) {
		if (!message.message.user) { return false; }
		this.message.user.$set.eligibleJoinCompanies.sort((a, b) => {
			return a.id.localeCompare(b.id);
		});
		message.message.user.$set.eligibleJoinCompanies.sort((a, b) => {
			return a.id.localeCompare(b.id);
		});
		return super.validateMessage(message);
	}
}

module.exports = MessageToInviteeTest;
