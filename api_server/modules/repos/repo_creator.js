// this class should be used to create all repo documents in the database

'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
var ModelCreator = require(process.env.CS_API_TOP + '/lib/util/restful/model_creator');
var Repo = require('./repo');
var NormalizeURL = require('./normalize_url');
var RepoSubscriptionGranter = require('./repo_subscription_granter');
var AddTeamMembers = require(process.env.CS_API_TOP + '/modules/teams/add_team_members');
var TeamCreator = require(process.env.CS_API_TOP + '/modules/teams/team_creator');
const Indexes = require('./indexes');
const Errors = require('./errors');

class RepoCreator extends ModelCreator {

	constructor (options) {
		super(options);
		this.errorHandler.add(Errors);
		this.dontSaveIfExists = true;	// if the repo exists, we don't bother saving anything to the database (we won't change it in any way)
	}

	get modelClass () {
		return Repo;	// class to use to create a post model
	}

	get collectionName () {
		return 'repos';	// data collection to use
	}

	// convenience wrapper
	createRepo (attributes, callback) {
		return this.createModel(attributes, callback);
	}

	// get attributes that are required for repo creation, and those that are optional,
	// along with their types
	getRequiredAndOptionalAttributes () {
		return {
			required: {
				string: ['url', 'firstCommitHash']
			},
			optional: {
				string: ['firstCommitHash', 'teamId', '_subscriptionCheat'],
				object: ['team'],
				'array(string)': ['emails'],
				'array(object)': ['users']
			}
		};
	}

	// validate attributes for the repo we are creating
	validateAttributes (callback) {
		// enforce URL normalization and lowercase on the first commit hash
		this.attributes.normalizedUrl = NormalizeURL(this.attributes.url);
		this.attributes.firstCommitHash = this.attributes.firstCommitHash.toLowerCase();
		// the subscription cheat allows unregistered users to subscribe to me-channel, needed for mock email testing
		this.subscriptionCheat = this.attributes._subscriptionCheat === this.request.api.config.secrets.subscriptionCheat;
		delete this.attributes._subscriptionCheat;
		process.nextTick(callback);
	}

	// do we allow the request to proceed if the document already exists in the database?
	modelCanExist () {
		// for repos yes, we'll return the repo just as if we'd created it
		return true;
	}

	// use this query to check if the repo exists arleady
	checkExistingQuery () {
		// check for a matching normalized URL
		return {
			query: {
				normalizedUrl: this.attributes.normalizedUrl
			},
			hint: Indexes.byNormalizedUrl
		};
	}

	// right before we save the model...
	preSave (callback) {
		this.attributes.creatorId = this.user.id;	// establish creator of the repo as originator of the request
		if (this.request.isForTesting()) { // special for-testing header for easy wiping of test data
			this.attributes._forTesting = true;
		}
		BoundAsync.series(this, [
			this.createId,	// requisition an ID for the repo
			this.joinToTeam,	// join the repo to a team, depending on whether it already exists and information in the request
			super.preSave		// proceed with the save...
		], callback);
	}

	// requisition an ID for the repo we are about to create
	createId (callback) {
		this.attributes._id = this.data.repos.createId();
		callback();
	}

	// join the repo to a team, in one of the ways:
	//  
	// 1 - if the repo already existed, then we're just going to return that repo, 
	//    but if the user specified some users to add to the team, we'll do that
	// 2 - otherwise maybe the user specified to join the repo to an existing team
	// 3 - otherwise the user must have specified team parameters to also create a team on the fly
	//
	joinToTeam (callback) {
		if (this.existingModel) {
			this.repoExisted = true;
			// join any users specified in the request to the team that already owns the existing repo
			this.joinUsersToRepoTeam(callback);
		}
		else if (this.attributes.teamId) {
			// join the repo to an existing team, as specified in the request
			this.joinRepoToExistingTeam(callback);
		}
		else if (this.attributes.team) {
			// create a team for this repo, and join the repo to it
			this.createTeamForRepo(callback);
		}
		else {
			return callback(this.errorHandler.error('parameterRequired', { info: 'team' }));
		}
	}

	// if users were specified in the request, join them to the team that owns the already-existing repo
	joinUsersToRepoTeam (callback) {
		// first verify that the SHA for the first commit is valid
		if (this.attributes.firstCommitHash !== this.existingModel.get('firstCommitHash')) {
			return callback(this.errorHandler.error('shaMismatch'));
		}
		if (
			!this.attributes.emails &&
			!this.attributes.users &&
			(this.user.get('teamIds') || []).indexOf(this.existingModel.get('teamId')) !== -1
		) {
			// nothing to do
			this.noNewUsers = true;
			return callback();
		}
		// add the users to the team
		let adder = new AddTeamMembers({
			request: this.request,
			users: [this.user],		// add the user issuing the request
			addUsers: this.attributes.users,	// add any other users specified by attributes
			emails: this.attributes.emails,		// add any other users specified by email
			teamId: this.existingModel.get('teamId'),	
			subscriptionCheat: this.subscriptionCheat // allows unregistered users to subscribe to me-channel, needed for mock email testing
		});
		adder.addTeamMembers(error => {
			if (error) { return callback(error); }
			this.team = adder.team;
			this.newUsers = adder.membersAdded;
			this.attachToResponse.users = adder.membersAdded.map(member => member.getSanitizedObject());	// return users in the response
			delete this.attributes.emails;
			delete this.attributes.users;
			process.nextTick(callback);
		});
	}

	// join the repo we are going to create to an existing team, as specified in the request
	joinRepoToExistingTeam (callback) {
		BoundAsync.series(this, [
			this.getTeam,		// get the team we are joining to
			this.addUsersToTeam	// add any users specified in the request to the team
		], callback);
	}

	// get the team that a repo is going to be joined to
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
				this.repoAddedToTeam = true;
				callback();
			}
		);
	}

	// for any users specified in the request, add them to the team that will own the repo
	addUsersToTeam (callback) {
		if (!(this.attributes.emails instanceof Array) &&
			!(this.attributes.users instanceof Array)) {
			return callback();
		}
		let adder = new AddTeamMembers({
			request: this.request,
			emails: this.attributes.emails,
			addUsers: this.attributes.users,
			team: this.team,
			subscriptionCheat: this.subscriptionCheat // allows unregistered users to subscribe to me-channel, needed for mock email testing
		});
		adder.addTeamMembers(error => {
			if (error) { return callback(error); }
			this.newUsers = adder.membersAdded;
			this.existingUsers = adder.existingMembers;
			this.attachToResponse.users = adder.membersAdded.map(member => member.getSanitizedObject());	// return the added users in the request response
			delete this.attributes.emails;
			delete this.attributes.users;
			process.nextTick(callback);
		});
	}

	// create a new team to own this new repo
	createTeamForRepo (callback) {
		this.teamCreator = new TeamCreator({
			request: this.request,
			subscriptionCheat: this.subscriptionCheat // allows unregistered users to subscribe to me-channel, needed for mock email testing
		});
		this.teamCreator.createTeam(
			this.attributes.team,
			(error, team) => {
				if (error) { return callback(error); }
				this.attributes.teamId = team.id;
				this.attributes.companyId = team.get('companyId');
				// attach the team and company created, along with any users added to the team, to the request response
				this.attachToResponse.team = team.getSanitizedObject();
				this.attachToResponse.company = this.teamCreator.company.getSanitizedObject();
				this.newUsers = this.teamCreator.members;
				this.attachToResponse.users = this.teamCreator.members.map(member => member.getSanitizedObject());
				delete this.attributes.team;
				callback();
			}
		);
	}

	// after the repo has been saved...
	postSave (callback) {
		// grant permission to any users on the team that owns this repo, to subscribe to the messager channel for this repo
		this.grantUserMessagingPermissions(callback);
	}

	// grant permission to any users on the team that owns this repo, to subscribe to the messager channel for this repo
	grantUserMessagingPermissions (callback) {
		let granterOptions = {
			data: this.data,
			messager: this.api.services.messager,
			repo: this.model,
			users: this.newUsers || [],
			request: this.request
		};
		if (this.repoAddedToTeam) {
			// if we added the repo to an existing team, and some of those users already existed, we still need to
			// make sure they have permission to subscribe to the repo channel
			granterOptions.users = granterOptions.users.concat(this.existingUsers || []);
		}
		new RepoSubscriptionGranter(granterOptions).grantToUsers(error => {
			if (error) {
				return callback(this.errorHandler.error('messagingGrant', { reason: error }));
			}
			callback();
		});
	}

}

module.exports = RepoCreator;
