'use strict';

var GetCompanyTest = require('./get_company_test');

class ACLTest extends GetCompanyTest {

	constructor (options) {
		super(options);
		this.withoutMe = true;	// create the repo without me as a member of the team, therefore company
	}

	get description () {
		return 'should return an error when trying to fetch a company that i\'m not a member of';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1009'	// readAuth
		};
	}

	setPath (callback) {
		this.path = '/companies/' + this.otherCompany._id;
		callback();
	}
}

module.exports = ACLTest;
