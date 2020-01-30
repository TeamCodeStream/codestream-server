// handle a GET /teams/:id request to fetch a single team

'use strict';

const GetRequest = require(process.env.CS_API_TOP + '/lib/util/restful/get_request');
const ArrayUtilities = require(process.env.CS_API_TOP + '/server_utils/array_utilities');

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
		this.responseData.team.companyMemberCount = await this.getCompanyMemberCount(company);
		return super.handleResponse();
	}

	async getCompanyMemberCount (company) {
		const teams = await this.data.teams.getByIds(company.get('teamIds') || []);
		const memberIds = teams.reduce((memberIds, team) => {
			memberIds = ArrayUtilities.union(memberIds, team.get('memberIds') || []);
			return memberIds;
		}, []);
		return memberIds.length;
	}
}

module.exports = GetTeamRequest;
