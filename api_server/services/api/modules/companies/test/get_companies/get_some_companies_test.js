'use strict';

var CodeStream_API_Test = require(process.env.CI_API_TOP + '/lib/test_base/codestream_api_test');

const DESCRIPTION = 'should return the right companies when requesting companies by IDs';

class Get_Some_Companies_Test extends CodeStream_API_Test {

	get_description () {
		return DESCRIPTION;
	}

	before (callback) {
		this.user_factory.create_random_users(4, (error, users) => {
			if (error) { return callback(error); }
			this.company_subset = [users[1], users[3]].map(user => user.companies && user.companies[0]);
			var ids_subset = this.company_subset.map(company => company._id);
			this.path = '/companies?ids=' + ids_subset.join(',');
			callback();
		});
	}

	validate_response (data) {
		this.validate_matching_objects(this.company_subset, data.companies, 'companies');
	}
}

module.exports = Get_Some_Companies_Test;
