'use strict';

const InboundEmailTest = require('./inbound_email_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');

class StreamNoMatchTeamTest extends InboundEmailTest {

	get description () {
		return 'should return an error when trying to send an inbound email request with a stream ID and a team ID that are not related';
	}

	getExpectedError () {
		return {
			code: 'INBE-1006',
		};
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,			// normal test setup
			this.createOtherTeam,	// create another team
			this.makePostData
		], callback);
	}

	// create a second repo (and team) ... we'll use this team's ID but the normal
	// stream ID ... this is not allowed!
	createOtherTeam (callback) {
		this.companyFactory.createRandomCompany(
			(error, response) => {
				if (error) { return callback(error); }
				this.otherTeam = response.team;
				callback();
			},
			{
				token: this.token	// "i" will create this repo/team
			}
		);
	}

	// make the data to be used in the request that triggers the message
	makePostData (callback) {
		if (!this.otherTeam) { return callback(); }
		super.makePostData(() => {
			// inject the other team ID
			let toAddress = this.data.to[0].address;
			let atIndex = toAddress.indexOf('@');
			let dotIndex = toAddress.indexOf('.');
			this.data.to[0].address = toAddress.slice(0, dotIndex + 1) + this.otherTeam.id +
				toAddress.slice(atIndex);
			this.data.to.splice(1);
			callback();
		});
	}
}

module.exports = StreamNoMatchTeamTest;
