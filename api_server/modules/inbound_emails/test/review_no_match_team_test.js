'use strict';

const ReviewReplyTest = require('./review_reply_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');

class ReviewNoMatchTeamTest extends ReviewReplyTest {

	get description () {
		return 'should return an error when trying to send an inbound email request with a review ID and a team ID that are not related';
	}

	getExpectedError () {
		return {
			code: 'INBE-1009',
		};
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,			// normal test setup
			this.createOtherTeam,	// create another team
			this.inviteUser,		// invite the replying user to this team
			this.makePostData
		], callback);
	}

	// create a second repo (and team) ... we'll use this team's ID but the normal
	// review ID ... this is not allowed!
	createOtherTeam (callback) {
		this.teamFactory.createRandomTeam(
			(error, response) => {
				if (error) { return callback(error); }
				this.otherTeam = response.team;
				this.otherTeamStream = response.streams[0];
				callback();
			},
			{
				token: this.token	// "i" will create this repo/team
			}
		);
	}

	// invite the replying user to the other team
	inviteUser (callback) {
		this.doApiRequest(
			{
				method: 'post',
				path: '/users',
				data: {
					teamId: this.otherTeam.id,
					email: this.users[1].user.email
				},
				token: this.token
			},
			callback
		);
	}
	
	// make the data to be used in the request that triggers the message
	makePostData (callback) {
		if (!this.otherTeam) { return callback(); }
		super.makePostData(() => {
			// inject the other team ID
			let toAddress = this.data.to[0].address;
			const atSplit = toAddress.split('@');
			const dotSplit = atSplit[0].split('.');
			dotSplit[2] = this.otherTeam.id;
			dotSplit[1] = this.otherTeamStream.id;
			this.data.to[0].address = `${dotSplit.join('.')}@${atSplit[1]}`;
			callback();
		});
	}
}

module.exports = ReviewNoMatchTeamTest;
