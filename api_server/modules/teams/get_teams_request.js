// handle a GET /streams request to fetch multiple teams

'use strict';

const GetManyRequest = require(process.env.CS_API_TOP + '/lib/util/restful/get_many_request');
const ArrayUtilities = require(process.env.CS_API_TOP + '/server_utils/array_utilities');

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
		await this.getCompanyMemberCount(companies);
		for (let team of this.responseData.teams) {
			const company = companies.find(company => company.id === team.companyId);
			if (company) {
				['plan', 'trialStartDate', 'trialEndDate', 'planStartDate'].forEach(attribute => {
					team[attribute] = company.get(attribute);
				});
			}
			team.companyMemberCount = (this.memberIdsByCompany[team.companyId] || []).length;
		}
		return super.handleResponse();
	}

	async getCompanyMemberCount (companies) {
		const teamIds = companies.reduce((teamIds, company) => {
			teamIds = [...teamIds, ...(company.get('teamIds') || [])];
			return teamIds;
		}, []);
		const haveTeamIds = this.responseData.teams.map(team => team.id);
		const needTeamIds = ArrayUtilities.difference(teamIds, haveTeamIds);
		let otherTeams = [];
		if (needTeamIds.length > 0) {
			otherTeams = await this.data.teams.getByIds(needTeamIds);
			otherTeams = otherTeams.map(team => team.attributes);
		}
		
		const teams = [...this.responseData.teams, ...otherTeams];
		this.memberIdsByCompany = {};
		for (let team of teams) {
			this.memberIdsByCompany[team.companyId] = ArrayUtilities.union(
				this.memberIdsByCompany[team.companyId] || [],
				team.memberIds || []
			);
		}
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
