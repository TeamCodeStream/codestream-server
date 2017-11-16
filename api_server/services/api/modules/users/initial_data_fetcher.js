'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');

class InitialDataFetcher  {

	constructor (options) {
		Object.assign(this, options);
	}

	fetchInitialData (callback) {
		this.initialData = {};
		BoundAsync.series(this, [
			this.getTeams,
			this.sanitizeTeams,
			this.getRepos,
			this.sanitizeRepos
		], error => {
			callback(error, this.initialData);
		});
	}

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

	getRepos (callback) {
		let teamIds = this.request.user.get('teamIds') || [];
		if (teamIds.length === 0) {
			this.repos = [];
			return callback();
		}
		let query = {
			teamId: { $in: teamIds },
			deactivated: false
		};
		this.request.data.repos.getByQuery(
			query,
			(error, repos) => {
				if (error) { return callback(error); }
				this.repos = repos;
				callback();
			}
		);
	}

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
