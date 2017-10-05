'use strict';

var Get_Many_Request = require(process.env.CI_API_TOP + '/lib/util/restful/get_many_request');

class Get_Companies_Request extends Get_Many_Request {

	process (callback) {
		if (this.request.params.id === '~') {
			this.respond_with_companies(callback);
		}
		else {
			super.process(callback);
		}
	}

	respond_with_companies (callback) {
		this.data.companies.get_by_ids(
			this.user.get('company_ids'),
			(error, companies) => {
				if (error) { return callback(error); }
				this.response_data = { companies: companies };
				return process.nextTick(callback);
			}
		);
	}
}

module.exports = Get_Companies_Request;
