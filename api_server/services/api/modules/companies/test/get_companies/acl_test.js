'use strict';

var Get_Companies_Test = require('./get_companies_test');

class ACL_Test extends Get_Companies_Test {

	get description () {
		return 'should return an error when trying to fetch companies including one that i\'m not a member of';
	}

	get_expected_error () {
		return {
			code: 'RAPI-1009'
		};
	}

	set_path (callback) {
		let ids = [
			this.my_company._id,
			this.other_companies[0]._id,
			this.foreign_company._id
		];
		this.path = '/companies?ids=' + ids.join(',');
		callback();
	}
}

module.exports = ACL_Test;
