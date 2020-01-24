// handle a GET /streams request to fetch multiple teams

'use strict';

const GetManyRequest = require(process.env.CS_API_TOP + '/lib/util/restful/get_many_request');

class GetTeamsRequest extends GetManyRequest {

	// authorize the request for the current user
	async authorize () {
		if (this.request.query.mine !== undefined) {
			// user has access to their own teams by definition
			return;
		}
		else if (!this.request.query.ids) {
			// must provide IDs
			throw this.errorHandler.error('parameterRequired', { info: 'ids' });
		}
		// user must be a member of the requested teams
		const teamIds = decodeURIComponent(this.request.query.ids).toLowerCase().split(',');
		if (!this.user.hasTeams(teamIds)) {
			throw this.errorHandler.error('readAuth');
		}
	}

	// process the request (override base class)
	async process () {
		// if "mine" specified, fetch the teams in my teamIds array
		if (this.request.query.mine !== undefined) {
			this.ids = this.user.get('teamIds') || [];
		}
		await super.process();
	}

	// handle the response to the request
	async handleResponse () {
		if (this.gotError) {
			return super.handleResponse();
		}

		// company company plan attributes to the team attributes
		const companyIds = this.responseData.teams.map(team => team.companyId);
		const companies = await this.data.companies.getByIds(companyIds);
		for (let team of this.responseData.teams) {
			const company = companies.find(company => company.id === team.companyId);
			if (company) {
				['plan', 'trialStartDate', 'trialEndDate', 'planStartDate'].forEach(attribute => {
					team[attribute] = company.get(attribute);
				});
			}
		}
		return super.handleResponse();
	}

	// describe this route for help
	static describe (module) {
		const description = GetManyRequest.describe(module);
		description.access = 'User must be a member of the teams requested';
		description.input.looksLike.mine = '<when present, return all the teams the current user is in>';
		return description;
	}
}

module.exports = GetTeamsRequest;
