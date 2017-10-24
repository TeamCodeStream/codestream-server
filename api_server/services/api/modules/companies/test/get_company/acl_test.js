'use strict';

var Get_Company_Test = require('./get_company_test');

class ACL_Test extends Get_Company_Test {

	constructor (options) {
		super(options);
		this.without_me = true;
	}

	get description () {
		return 'should return an error when trying to fetch a company that i\'m not a member of';
	}

	get_expected_error () {
		return {
			code: 'RAPI-1009'
		};
	}

	set_path (callback) {
		this.path = '/companies/' + this.other_company._id;
		callback();
	}	
}

module.exports = ACL_Test;
