// handle fetching "initial data" for a given user ... the initial data is the data
// we assume the client will need immediately upon login or confirmation, saving them
// the trouble of fetching it immediately afterwards

'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const RepoIndexes = require(process.env.CS_API_TOP + '/modules/repos/indexes');

class InitialDataFetcher  {

	constructor (options) {
		Object.assign(this, options);
	}

	// fetch the initial data needed
	fetchInitialData (callback) {
		this.initialData = {};
		BoundAsync.series(this, [
			this.getTeams,			// get the teams they are a member of
			this.sanitizeTeams,		// sanitize for return to the client
			this.getRepos,			// get the repos owned by their teams
			this.sanitizeRepos		// sanitize for return to the client
		], error => {
			callback(error, this.initialData);
		});
	}

	// get the teams the user is a member of
	getTeams (callback) {
		let teamIds = this.request.user.get('teamIds') || [];
		if (teamIds.length === 0) {
			this.teams = [];
			return callback();
		}
		this.request.data.teams.getByIds(
			teamIds,
			(error, teams) => {
				if (error) { return callback(error); }
				this.teams = teams;
				callback();
			}
		);
	}

	// sanitize the teams for return to the client (no attributes clients shouldn't see)
	sanitizeTeams (callback) {
		this.request.sanitizeModels(
			this.teams,
			(error, objects) => {
				if (error) { return callback(error); }
				this.initialData.teams = objects;
				callback();
			}
		);
	}

	// get the repos owned by the teams the user is a member of
	getRepos (callback) {
		let teamIds = this.request.user.get('teamIds') || [];
		if (teamIds.length === 0) {
			this.repos = [];
			return callback();
		}
		let query = {
			teamId: this.request.data.repos.inQuery(teamIds)
		};
		this.request.data.repos.getByQuery(
			query,
			(error, repos) => {
				if (error) { return callback(error); }
				this.repos = repos;
				callback();
			},
			{
				databaseOptions: {
					hint: RepoIndexes.byTeamId
				}
			}
		);
	}

	// sanitize the repos for return to the client (no attributes clients shouldn't see)
	sanitizeRepos (callback) {
		this.request.sanitizeModels(
			this.repos,
			(error, objects) => {
				this.initialData.repos = objects;
				callback();
			}
		);
	}
}

module.exports = InitialDataFetcher;
