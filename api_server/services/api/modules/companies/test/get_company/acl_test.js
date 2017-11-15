'use strict';

var GetCompanyTest = require('./get_company_test');

class ACLTest extends GetCompanyTest {

	constructor (options) {
		super(options);
		this.withoutMe = true;
	}

	get description () {
		return 'should return an error when trying to fetch a company that i\'m not a member of';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1009'
		};
	}

	setPath (callback) {
		this.path = '/companies/' + this.otherCompany._id;
		callback();
	}	
}

module.exports = ACLTest;
