// handle the 'GET /no-auth/find-repo' request, to find if a repo is already known to the system, and if
// so, what team owns it and what are the usernames of the users on the team ... authorization is by
// having the correct hash for the first commit of the repo

'use strict';

var RestfulRequest = require(process.env.CS_API_TOP + '/lib/util/restful/restful_request');
var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
var NormalizeURL = require('./normalize_url');
const Indexes = require('./indexes');
const UserIndexes = require(process.env.CS_API_TOP + '/modules/users/indexes');

class FindRepoRequest extends RestfulRequest {

	authorize (callback) {
		return callback(false);	// no ACL check needed, authorization is by whether you have the correct first commit hash for the repo
	}

	process (callback) {
		BoundAsync.series(this, [
			this.require,		// handle required request parameters
			this.normalize,		// normalize the request parameters
			this.findRepo,		// attempt to find the repo
			this.getUsernames	// get the unique usernames for the team that owns the repo
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

	// normalize the request parameters
	normalize (callback) {
		// normalize the incoming URL and enforce lowercase on the first commit hash
		this.normalizedUrl = NormalizeURL(decodeURIComponent(this.request.query.url));
		this.request.query.firstCommitHash = this.request.query.firstCommitHash.toLowerCase();
		process.nextTick(callback);
	}

	// attempt to find the repo by (normalized) URL
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
					// oops, you have to have the correct hash for the first commit
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

	// get the set of unique usernames represented by the users who are on the team that owns the repo
	getUsernames (callback) {
		if (!this.repo) { 
			// did not find a matching repo
			return callback(); 
		}
		let teamId = this.repo.get('teamId');
		let query = {
			teamIds: teamId
		};
		// query for all users in the team that owns the repo, but only send back the usernames
		// for users who have a username, and users who aren't deactivated
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
