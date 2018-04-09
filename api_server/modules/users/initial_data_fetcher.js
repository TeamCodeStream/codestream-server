// handle fetching "initial data" for a given user ... the initial data is the data
// we assume the client will need immediately upon login or confirmation, saving them
// the trouble of fetching it immediately afterwards

'use strict';

const RepoIndexes = require(process.env.CS_API_TOP + '/modules/repos/indexes');

class InitialDataFetcher  {

	constructor (options) {
		Object.assign(this, options);
	}

	// fetch the initial data needed
	async fetchInitialData () {
		this.initialData = {};
		await this.getTeams();			// get the teams they are a member of
		await this.getRepos();			// get the repos owned by their teams
		return this.initialData;
	}

	// get the teams the user is a member of
	async getTeams () {
		const teamIds = this.request.user.get('teamIds') || [];
		if (teamIds.length === 0) {
			this.initialData.teams = [];
			return;
		}
		const teams = await this.request.data.teams.getByIds(teamIds);
		this.initialData.teams = await this.request.sanitizeModels(teams);
	}

	// get the repos owned by the teams the user is a member of
	async getRepos () {
		const teamIds = this.request.user.get('teamIds') || [];
		if (teamIds.length === 0) {
			this.initialData.repos = [];
			return;
		}
		const query = {
			teamId: this.request.data.repos.inQuery(teamIds)
		};
		const repos = await this.request.data.repos.getByQuery(
			query,
			{
				databaseOptions: {
					hint: RepoIndexes.byTeamId
				}
			}
		);
		this.initialData.repos = await this.request.sanitizeModels(repos);
	}
}

module.exports = InitialDataFetcher;
