// handle a GET /companies/:id request to fetch a single company

'use strict';

const GetRequest = require(process.env.CS_API_TOP + '/lib/util/restful/get_request');

class GetCompanyRequest extends GetRequest {

	// describe this route for help
	static describe (module) {
		const description = GetRequest.describe(module);
		description.access = 'User must be a member of the company';
		return description;
	}
}

module.exports = GetCompanyRequest;
