'use strict';

var RestfulRequest = require(process.env.CS_API_TOP + '/lib/util/restful/restful_request');
var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var NormalizeURL = require('normalize-url');

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

	require (callback) {
		this.requireParameters('query', ['url', 'firstCommitHash'], callback);
	}

	normalize (callback) {
		this.request.query.url = NormalizeURL(
			decodeURIComponent(this.request.query.url).toLowerCase(),
			{
				removeQueryParameters: [/^.+/] // remove them all!
			}
		);
		this.request.query.firstCommitHash = this.request.query.firstCommitHash.toLowerCase();
		process.nextTick(callback);
	}

	findRepo (callback) {
		let query = {
			url: this.request.query.url,
			deactivated: false
		};
		this.data.repos.getByQuery(
			query,
			(error, repos) => {
				if (error) { return callback(error); }
				if (repos.length === 0) {
					return callback();	// no matching repos, we'll just send an empty response
				}
				this.repo = repos[0];
				if (this.repo.get('firstCommitHash') !== this.request.query.firstCommitHash) {
					return callback(this.errorHandler.error('shaMismatch'));
				}
				this.responseData.repo = this.repo.getSanitizedObject();
				callback();
			}
		);
	}

	getUsernames (callback) {
		if (!this.repo) { return callback(); }
		let teamId = this.repo.get('teamId');
		let query = {
			deactivated: false,
			teamIds: teamId
		};
		this.data.users.getByQuery(
			query,
			(error, users) => {
				if (error) { return callback(error); }
				this.responseData.usernames = users.
					map(user => user.username).
					filter(username => !!username);
				callback();
			},
			{
				databaseOptions: {
					fields: ['username'],
				},
				noCache: true
			}
		);
	}
}

module.exports = FindRepoRequest;
