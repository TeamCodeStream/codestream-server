'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var ModelCreator = require(process.env.CS_API_TOP + '/lib/util/restful/model_creator');
var Repo = require('./repo');
var NormalizeURL = require('./normalize_url');
var Allow = require(process.env.CS_API_TOP + '/lib/util/allow');
var AddTeamMembers = require(process.env.CS_API_TOP + '/services/api/modules/teams/add_team_members');
var TeamCreator = require(process.env.CS_API_TOP + '/services/api/modules/teams/team_creator');
var CodeStreamModelValidator = require(process.env.CS_API_TOP + '/lib/models/codestream_model_validator');
const RepoAttributes = require('./repo_attributes');
const Indexes = require('./indexes');
const Errors = require('./errors');

class RepoCreator extends ModelCreator {

	constructor (options) {
		super(options);
		this.errorHandler.add(Errors);
		this.dontSaveIfExists = true;
	}

	get modelClass () {
		return Repo;
	}

	get collectionName () {
		return 'repos';
	}

	createRepo (attributes, callback) {
		return this.createModel(attributes, callback);
	}

	getRequiredAttributes () {
		return ['url', 'firstCommitHash'];
	}

	validateAttributes (callback) {
		this.validator = new CodeStreamModelValidator(RepoAttributes);
		let error =
			this.validateUrl() ||
			this.validateSha();
		if (error) {
			return callback(error);
		}
		process.nextTick(callback);
	}

	validateUrl () {
		let error = this.validator.validateUrl(this.attributes.url);
		if (error) {
		 	return { url: error };
	 	}
	}

	validateSha () {
		let error = this.validator.validateString(this.attributes.firstCommitHash);
		if (error) {
			return { firstCommitHash: error };
		}
	}

	normalize (callback) {
		if (typeof this.attributes.url === 'string') { // validation to come later
			this.attributes.normalizedUrl = NormalizeURL(this.attributes.url);
		}
		if (typeof this.attributes.firstCommitHash === 'string') { // validation to come later
			this.attributes.firstCommitHash = this.attributes.firstCommitHash.toLowerCase();
		}
		process.nextTick(callback);
	}

	allowAttributes (callback) {
		Allow(
			this.attributes,
			{
				string: ['url', 'normalizedUrl', 'firstCommitHash', 'teamId'],
				object: ['team'],
				'array(string)': ['emails']
			}
		);
		process.nextTick(callback);
	}

	modelCanExist () {
		return true;
	}

	checkExistingQuery () {
		return {
			query: {
				normalizedUrl: this.attributes.normalizedUrl
			},
			hint: Indexes.byNormalizedUrl
		};
	}

	preSave (callback) {
		this.attributes.creatorId = this.user.id;
		BoundAsync.series(this, [
			this.joinToTeam,
			super.preSave
		], callback);
	}

	joinToTeam (callback) {
		if (this.existingModel) {
			this.repoExisted = true;
			this.joinUsersToRepoTeam(callback);
		}
		else if (this.attributes.teamId) {
			this.joinRepoToExistingTeam(callback);
		}
		else if (this.attributes.team) {
			this.createTeamForRepo(callback);
		}
		else {
			return callback(this.errorHandler.error('attributeRequired', { info: 'team' }));
		}
	}

	joinUsersToRepoTeam (callback) {
		// join the current user and any other users to the team that already owns this repo
		// first verify that the SHA for the first commit is valid
		if (this.attributes.firstCommitHash !== this.existingModel.get('firstCommitHash')) {
			return callback(this.errorHandler.error('shaMismatch'));
		}
		if (
			!this.attributes.emails &&
			(this.user.get('teamIds') || []).indexOf(this.existingModel.get('teamId')) !== -1
		) {
			return callback();
		}
		let adder = new AddTeamMembers({
			request: this.request,
			users: [this.user],
			emails: this.attributes.emails,
			teamId: this.existingModel.get('teamId')
		});
		adder.addTeamMembers(error => {
			if (error) { return callback(error); }
			this.attachToResponse.users = adder.sanitizedUsers;
			process.nextTick(callback);
		});
	}

	joinRepoToExistingTeam (callback) {
		BoundAsync.series(this, [
			this.getTeam,
			this.addUsersToTeam
		], callback);
	}

	getTeam (callback) {
		// join this repo to the team already specified by the caller
		this.data.teams.getById(
			this.attributes.teamId,
			(error, team) => {
			 	if (error) { return callback(error); }
				if (!team) {
					return callback(this.errorHandler.error('notFound', { info: 'team' }));
				}
				if ((team.get('memberIds') || []).indexOf(this.user.id) === -1) {
					return callback(this.errorHandler.error('createAuth', { reason: 'user not on team' }));
				}
				this.team = team;
				this.attributes.companyId = team.get('companyId');
				callback();
			}
		);
	}

	addUsersToTeam (callback) {
		if (!(this.attributes.emails instanceof Array)) {
			return callback();
		}
		let adder = new AddTeamMembers({
			request: this.request,
			emails: this.attributes.emails,
			team: this.team
		});
		adder.addTeamMembers(error => {
			if (error) { return callback(error); }
			this.attachToResponse.users = adder.sanitizedUsers;
			delete this.attributes.emails;
			process.nextTick(callback);
		});
	}

	createTeamForRepo (callback) {
		// create a new team for this repo
		this.teamCreator = new TeamCreator({
			request: this.request
		});
		this.teamCreator.createTeam(
			this.attributes.team,
			(error, team) => {
				if (error) { return callback(error); }
				this.attributes.teamId = team.id;
				this.attributes.companyId = team.get('companyId');
				this.attachToResponse.team = team.getSanitizedObject();
				this.attachToResponse.company = this.teamCreator.attachToResponse.company;
				this.attachToResponse.users = this.teamCreator.attachToResponse.users;
				delete this.attributes.team;
				callback();
			}
		);
	}
}

module.exports = RepoCreator;
