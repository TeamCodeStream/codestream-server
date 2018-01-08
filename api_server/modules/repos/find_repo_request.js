'use strict';

var RestfulRequest = require(process.env.CS_API_TOP + '/lib/util/restful/restful_request');
var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var NormalizeURL = require('./normalize_url');
const Indexes = require('./indexes');
const UserIndexes = require(process.env.CS_API_TOP + '/modules/users/indexes');

class FindRepoRequest extends RestfulRequest {

	authorize (callback) {
		return callback(false);	// no ACL check needed, authorization is by whether you have the correct first commit hash for the repo
	}

	process (callback) {
		BoundAsync.series(this, [
			this.require,
			this.normalize,
			this.findRepo,
			this.getUsernames
		], callback);
	}

	// these parameters are required for the request
	require (callback) {
		this.requireAllowParameters(
			'query',
			{
				required: {
					string: ['url', 'firstCommitHash']
				}
			},
			callback
		);
	}

	normalize (callback) {
		this.normalizedUrl = NormalizeURL(decodeURIComponent(this.request.query.url));
		this.request.query.firstCommitHash = this.request.query.firstCommitHash.toLowerCase();
		process.nextTick(callback);
	}

	findRepo (callback) {
		let query = {
			normalizedUrl: this.normalizedUrl
		};
		this.data.repos.getByQuery(
			query,
			(error, repos) => {
				if (error) { return callback(error); }
				this.repo = repos.find(repo => !repo.get('deactivated'));
				if (!this.repo) {
					return callback();	// no matching (active) repos, we'll just send an empty response
				}
				if (this.repo.get('firstCommitHash') !== this.request.query.firstCommitHash) {
					return callback(this.errorHandler.error('shaMismatch'));
				}
				this.responseData.repo = this.repo.getSanitizedObject();
				callback();
			},
			{
				databaseOptions: {
					hint: Indexes.byNormalizedUrl
				}
			}
		);
	}

	getUsernames (callback) {
		if (!this.repo) { return callback(); }
		let teamId = this.repo.get('teamId');
		let query = {
			teamIds: teamId
		};
		this.data.users.getByQuery(
			query,
			(error, users) => {
				if (error) { return callback(error); }
				this.responseData.usernames = [];
				users.forEach(user => {
					if (!user.deactivated && user.username) {
						this.responseData.usernames.push(user.username);
					}
				});
				process.nextTick(callback);
			},
			{
				databaseOptions: {
					fields: ['username'],
					hint: UserIndexes.byTeamIds
				},
				noCache: true
			}
		);
	}
}

module.exports = FindRepoRequest;
