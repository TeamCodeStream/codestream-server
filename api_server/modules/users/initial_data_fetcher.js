// handle fetching "initial data" for a given user ... the initial data is the data
// we assume the client will need immediately upon login or confirmation, saving them
// the trouble of fetching it immediately afterwards

'use strict';

const RepoIndexes = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/repos/indexes');
const StreamIndexes = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/streams/indexes');
const CodeErrorIndexes = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/code_errors/indexes');
const ArrayUtilities = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/array_utilities');
const { awaitParallel } = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/await_utils');

class InitialDataFetcher  {

	constructor (options) {
		Object.assign(this, options);
	}

	// fetch the initial data needed
	async fetchInitialData () {
		this.initialData = {};
		await this.getTeams();			// get the teams they are a member of
		await this.getCompanies();		// get the companies associated with these teams
		this.updateTeamPlans();			// copy company plan info to their teams
		await this.getRepos();			// get the repos owned by their teams
		await this.getStreams();		// get streams owned by the teams
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
		this.companies = await this.request.data.companies.getByIds(companyIds);
		this.initialData.companies = await this.request.sanitizeModels(this.companies);
	}
	
	// copy company plan info to their teams ... we've moved plan info from the team to
	// the company object, but since the client is looking for it in the team object,
	// we'll copy it here in the returned data ... at some point, we may modify the
	// client to actually look for it in the company object, but this is a cheat for now
	updateTeamPlans () {
		for (let team of this.initialData.teams) {
			const company = this.companies.find(company => company.id === team.companyId);
			if (company) {
				['plan', 'trialStartDate', 'trialEndDate', 'planStartDate'].forEach(attribute => {
					team[attribute] = company.get(attribute);
				});
			}
		}
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
	
	// get team streams and streams associated with followed objects
	async getStreams () {
		const teamIds = this.user.get('teamIds') || [];
		if (teamIds.length === 0) {
			return [];
		}
		const streams = await this.request.data.streams.getByQuery(
			{
				teamId: this.request.data.streams.inQuery(teamIds)
			},
			{
				hint: StreamIndexes.byTeamId
			}
		);
		this.initialData.streams = await this.request.sanitizeModels(streams);
	}
}

module.exports = InitialDataFetcher;
