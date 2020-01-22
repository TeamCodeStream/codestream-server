// handle fetching "initial data" for a given user ... the initial data is the data
// we assume the client will need immediately upon login or confirmation, saving them
// the trouble of fetching it immediately afterwards

'use strict';

const RepoIndexes = require(process.env.CS_API_TOP + '/modules/repos/indexes');
const ArrayUtilities = require(process.env.CS_API_TOP + '/server_utils/array_utilities');

class InitialDataFetcher  {

	constructor (options) {
		Object.assign(this, options);
	}

	// fetch the initial data needed
	async fetchInitialData () {
		this.initialData = {};
		await this.getTeams();			// get the teams they are a member of
		await this.getCompanies();		// get the companies associated with these teams
		await this.getRepos();			// get the repos owned by their teams
		return this.initialData;
	}

	// get the teams the user is a member of
	async getTeams () {
		const teamIds = this.user.get('teamIds') || [];
		if (teamIds.length === 0) {
			this.initialData.teams = [];
			return;
		}
		this.teams = await this.request.data.teams.getByIds(teamIds);
		this.initialData.teams = await this.request.sanitizeModels(this.teams);
	}

	// get the companies that own the teams
	async getCompanies () {
		const userCompanyIds = this.user.get('companyIds') || [];
		const teamCompanyIds = this.initialData.teams.map(team => team.companyId);
		const companyIds = ArrayUtilities.union(userCompanyIds, teamCompanyIds);
		if (companyIds.length === 0) {
			this.initialData.companies = [];
			return;
		}
		const companies = await this.request.data.companies.getByIds(companyIds);
		this.initialData.companies = await this.request.sanitizeModels(companies);
	}
	
	// get the repos owned by the teams the user is a member of
	async getRepos () {
		const teamIds = this.user.get('teamIds') || [];
		if (teamIds.length === 0) {
			this.initialData.repos = [];
			return;
		}
		const query = {
			teamId: this.request.data.repos.inQuery(teamIds)
		};
		const repos = await this.request.data.repos.getByQuery(
			query,
			{ hint: RepoIndexes.byTeamId }
		);
		this.initialData.repos = await this.request.sanitizeModels(repos);
	}
}

module.exports = InitialDataFetcher;
