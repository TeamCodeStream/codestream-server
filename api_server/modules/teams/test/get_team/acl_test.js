'use strict';

var GetCompanyTest = require('./get_team_test');

class ACLTest extends GetCompanyTest {

	constructor (options) {
		super(options);
		this.withoutMe = true;
	}

	get description () {
		return 'should return an error when trying to fetch a team that i\'m not a member of';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1009'
		};
	}

	setPath (callback) {
		this.path = '/teams/' + this.otherTeam._id;
		callback();
	}
}

module.exports = ACLTest;
