'use strict';

const Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');
const CodeStreamMessageTest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/broadcaster/test/codestream_message_test');
const CommonInit = require('./common_init');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');

class MessageToInviteeTest extends Aggregation(CodeStreamMessageTest, CommonInit) {

	constructor (options) {
		super(options);
		this.listeningUserIndex = 2;
	}

	get description () {
		return 'users who are registered and have been invited to join a team should get a message on their user channel updating their eligibleJoinCompanies, when they are removed from the team, canceling their invite';
	}

	setTestOptions (callback) {
		// don't yet invite user #2 to join the team
		this.teamOptions.members = [0, 3]; 
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

	// user #2 should be in their own company, so that the invite spawns a new (unregistered) user record
	createCompany (callback) {
		this.companyFactory.createRandomCompany((error, response) => {
			if (error) { return callback(error);}
			this.createCompanyResponse = response;
			callback();
		}, { token: this.users[this.listeningUserIndex].accessToken });
	}

	// test company creator now invites user #2 to join team,
	// this spawns an "unregistered" record for that user, but they should get the message on 
	// the channel for the original user record
	inviteUser (callback) {
		this.doApiRequest(
			{
				method: 'post',
				path: '/users',
				data: {
					email: this.users[this.listeningUserIndex].user.email,
					teamId: this.team.id
				},
				token: this.token
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.data.$addToSet = { removedMemberIds: response.user.id };
				callback();
			}
		);
	}

	// set the name of the channel we expect to receive a message on
	setChannelName (callback) {
		// expect on the "everyone" team channel
		this.channelName = `user-${this.users[this.listeningUserIndex].user.id}`;
		callback();
	}

	// generate the message by issuing a request
	generateMessage (callback) {
		// we expect a message with eligibleJoinCompanies
		const createdCompany = this.createCompanyResponse.company;
		this.message = {
			user: {
				id: this.users[this.listeningUserIndex].user.id,
				$set: {
					eligibleJoinCompanies: [
						// this is the original company the user created
						{
							id: createdCompany.id,
							name: createdCompany.name,
							teamId: createdCompany.everyoneTeamId,
							memberCount: 1,
							byInvite: true,
							accessToken: this.users[this.listeningUserIndex].accessToken
						}
					]					
				},
				$version: {
					before: '*'
				}
			}
		};

		// do the update, this should trigger a message to update eligibleJoinCompanies for user #2
		this.updateTeam(callback);
	}

	validateMessage (message) {
		if (
			!message.message.user ||
			!message.message.user.$set ||
			!message.message.user.$set.eligibleJoinCompanies
		) {
			return false;
		}
		return super.validateMessage(message);
	}
}

module.exports = MessageToInviteeTest;
