'use strict';

const PostTeamTest = require('./post_team_test');

class WebmailCompanyNameTest extends PostTeamTest {

	constructor (options) {
		super(options);
		this.wantWebmail = true;
		this.userOptions.userData = [{
			wantWebmail: true
		}];
	}

	get description () {
		return 'company name should be full email address of team creator when the team creator has a webmail address';
	}
}

module.exports = WebmailCompanyNameTest;
