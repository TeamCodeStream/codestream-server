'use strict';

const PrivatePermalinkTest = require('./private_permalink_test');
const Assert = require('assert');
const RandomString = require('randomstring');

class IdentifyScriptTest extends PrivatePermalinkTest {

	get description () {
		return 'identify script should be served when identify is provided in the query for a permalink';
	}

	createPermalink (callback) {
		super.createPermalink(error => {
			if (error) { return callback(error); }
			this.provider = RandomString.generate(10);
			this.path += `?identify=true&provider=${this.provider}`;
			callback();
		});
	}

	// validate the response to the test request
	validateResponse (data) {
		const emailProp = `email: '${this.currentUser.user.email}'`;
		const providerProp = `Provider: '${this.provider}'`;
		const teamProp = `'Team Name': '${this.team.name}'`;
		const identifyCall = 'window.analytics.identify';
		Assert.notEqual(data.indexOf(emailProp), -1, 'did not get expected email in the html response');
		Assert.notEqual(data.indexOf(providerProp), -1, 'did not get expected provider in the html response');
		Assert.notEqual(data.indexOf(teamProp), -1, 'did not get expected team name in the html response');
		Assert.notEqual(data.indexOf(identifyCall), -1, 'did not get expected identify call in the html response');
		super.validateResponse(data);
	}
}

module.exports = IdentifyScriptTest;
