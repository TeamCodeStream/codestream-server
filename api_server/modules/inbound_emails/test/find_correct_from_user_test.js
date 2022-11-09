'use strict';

const InboundEmailTest = require('./inbound_email_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');

class FindCorrectFromUserTest extends InboundEmailTest {

	constructor (options) {
		super(options);
		this.oneUserPerOrg = true;
	}

	get description () {
		return 'in one-user-per-org, should find the correct sender among multiple emails matching the from email on an inbound email request';
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.createOtherTeams,
			this.makeFinalPostData
		], callback);
	}

	// create several other teams
	createOtherTeams (callback) {
		this.otherTeamResponses = [];
		BoundAsync.timesSeries(
			this,
			3,
			this.createOtherTeam,
			callback
		);
	}

	createOtherTeam (n, callback) {
		this.companyFactory.createRandomCompany(
			(error, response) => {
				if (error) { return callback(error); }
				this.otherTeamResponses.push(response);
				callback();
			},
			{
				token: this.users[1].accessToken
			}
		);
	}

	// make the data to be used in the request that triggers the message
	makeFinalPostData (callback) {
		// we'll send from the 2nd team created, ensuring the first or last isn't the match to find
		const response = this.otherTeamResponses[1];
		this.useStream = response.streams[0];
		this.team = response.team;
		const toEmail = `${this.useStream.id}.${this.team.id}@${this.apiConfig.email.replyToDomain}`;
		this.data.to = [{ address: toEmail }];
		this.expectedCreatorId = response.user.id;
		callback();
	}
}

module.exports = FindCorrectFromUserTest;
