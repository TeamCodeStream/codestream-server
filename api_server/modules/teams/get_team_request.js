// handle a GET /teams/:id request to fetch a single team

'use strict';

const GetRequest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/get_request');

class GetTeamRequest extends GetRequest {

	// describe this route for help
	static describe (module) {
		const description = GetRequest.describe(module);
		description.access = 'User must be a member of the team';
		return description;
	}

	async handleResponse () {
		if (this.gotError) {
			return super.handleResponse();
		}
		const company = await this.data.companies.getById(this.responseData.team.companyId);
		if (company) {
			['plan', 'trialStartDate', 'trialEndDate', 'planStartDate'].forEach(attribute => {
				this.responseData.team[attribute] = company.get(attribute);
			});
		}
		this.responseData.team.companyMemberCount = await company.getCompanyMemberCount(this.data);
		return super.handleResponse();
	}
}

module.exports = GetTeamRequest;
