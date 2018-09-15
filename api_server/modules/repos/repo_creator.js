// this class should be used to create all repo documents in the database

'use strict';

const ModelCreator = require(process.env.CS_API_TOP + '/lib/util/restful/model_creator');
const Repo = require('./repo');
const NormalizeURL = require('./normalize_url');
const ExtractCompanyIdentifier = require('./extract_company_identifier');
const RepoSubscriptionGranter = require('./repo_subscription_granter');
const AddTeamMembers = require(process.env.CS_API_TOP + '/modules/teams/add_team_members');
const TeamCreator = require(process.env.CS_API_TOP + '/modules/teams/team_creator');
const Indexes = require('./indexes');
const Errors = require('./errors');
const StreamIndexes = require(process.env.CS_API_TOP + '/modules/streams/indexes');
const Path = require('path');

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
	async createRepo (attributes) {
		return await this.createModel(attributes);
	}

	// get attributes that are required for repo creation, and those that are optional,
	// along with their types
	getRequiredAndOptionalAttributes () {
		return {
			required: {
				string: ['url']
			},
			optional: {
				string: ['teamId', '_subscriptionCheat', 'firstCommitHash'],
				object: ['team'],
				'array(string)': ['emails', 'knownCommitHashes'],
				'array(object)': ['users']
			}
		};
	}

	// validate attributes for the repo we are creating
	async validateAttributes () {
		// enforce URL normalization and lowercase on the first commit hash
		this.attributes.normalizedUrl = NormalizeURL(this.attributes.url);
		this.attributes.companyIdentifier = ExtractCompanyIdentifier.getCompanyIdentifier(this.attributes.normalizedUrl);

		// create a "remotes" array, this is where remote URL information will be stored
		// as we move to multiple remotes per repo
		this.attributes.remotes = [{
			url: this.attributes.url,
			normalizedUrl: this.attributes.normalizedUrl,
			companyIdentifier: this.attributes.companyIdentifier
		}];

		// the subscription cheat allows unregistered users to subscribe to me-channel, needed for mock email testing
		this.subscriptionCheat = this.attributes._subscriptionCheat === this.request.api.config.secrets.subscriptionCheat;
		delete this.attributes._subscriptionCheat;

		// establish array of known commit hashes for the repo, this can be either through
		// 'firstCommitHash' (old way), or 'knownCommitHashes' (new way)
		this.attributes.knownCommitHashes = this.attributes.knownCommitHashes || [];
		if (this.attributes.firstCommitHash) {
			this.attributes.knownCommitHashes.push(this.attributes.firstCommitHash);
		}
		this.attributes.knownCommitHashes = this.attributes.knownCommitHashes.map(
			hash => hash.toLowerCase()
		);
		if (this.attributes.knownCommitHashes.length === 0) {
			throw this.errorHandler.error('parameterRequired', { info: 'firstCommitHash or knownCommitHashes' });
		}
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
	async preSave () {
		this.attributes.creatorId = this.user.id;	// establish creator of the repo as originator of the request
		if (this.request.isForTesting()) { // special for-testing header for easy wiping of test data
			this.attributes._forTesting = true;
		}
		this.createId();			// requisition an ID for the repo
		await this.joinToTeam();	// join the repo to a team, depending on whether it already exists and information in the request
		await this.getCompany();	// need the company object if we have an existing team that the user is joining
		await this.getTeamStreams();	// need any team streams if we have an existing team that the user is joining
		await this.getAllUsers();	// need all the users on the team, if we have an existing team that the user is joining
		await this.updateUserJoinMethod();	// update the joinMethod attribute for the user, as needed
		await this.extractName();	// extract a default name for this repo
		await super.preSave();		// proceed with the save...
	}

	// join the repo to a team, in one of the ways:
	//
	// 1 - if the repo already existed, then we're just going to return that repo,
	//    but if the user specified some users to add to the team, we'll do that
	// 2 - otherwise maybe the user specified to join the repo to an existing team
	// 3 - otherwise the user must have specified team parameters to also create a team on the fly
	//
	async joinToTeam () {
		if (this.existingModel) {
			this.repoExisted = true;
			// join any users specified in the request to the team that already owns the existing repo
			await this.joinUsersToRepoTeam();
		}
		else if (this.attributes.teamId) {
			// join the repo to an existing team, as specified in the request
			await this.joinRepoToExistingTeam();
		}
		else if (this.attributes.team) {
			// create a team for this repo, and join the repo to it
			await this.createTeamForRepo();
		}
		else {
			throw this.errorHandler.error('parameterRequired', { info: 'team' });
		}
	}

	// if users were specified in the request, join them to the team that owns the already-existing repo
	async joinUsersToRepoTeam () {
		// first verify that we have a known commit for this repo
		if (!this.existingModel.haveKnownCommitHash(this.attributes.knownCommitHashes)) {
			throw this.errorHandler.error('shaMismatch');
		}
		if (
			!this.attributes.emails &&
			!this.attributes.users &&
			(this.user.get('teamIds') || []).includes(this.existingModel.get('teamId'))
		) {
			// nothing to do
			this.noNewUsers = true;
			return;
		}

		// add the users to the team
		const adder = new AddTeamMembers({
			request: this.request,
			users: [this.user],		// add the user issuing the request
			addUsers: this.attributes.users,	// add any other users specified by attributes
			emails: this.attributes.emails,		// add any other users specified by email
			teamId: this.existingModel.get('teamId'),
			subscriptionCheat: this.subscriptionCheat // allows unregistered users to subscribe to me-channel, needed for mock email testing
		});
		await adder.addTeamMembers();
		this.team = adder.team;
		this.newUsers = adder.membersAdded;
		this.attachToResponse.users = adder.membersAdded.map(member => member.getSanitizedObject());	// return users in the response
		this.attachToResponse.team = this.team.getSanitizedObject();
		delete this.attributes.emails;
		delete this.attributes.users;
		this.joinMethod = 'Joined Team';
		this.primaryReferral = 'internal';
		if (adder.teamCreator && adder.teamCreator.get('originTeamId')) {
			this.originTeamId = adder.teamCreator.get('originTeamId');
		}
		this.userJoined = true;
	}

	// join the repo we are going to create to an existing team, as specified in the request
	async joinRepoToExistingTeam () {
		await this.getTeam();			// get the team we are joining to
		await this.getExistingMembers();	// get the existing members of the team
		await this.addUsersToTeam();	// add any users specified in the request to the team
	}

	// get the team that a repo is going to be joined to
	async getTeam () {
		// join this repo to the team already specified by the caller
		this.team = await this.data.teams.getById(this.attributes.teamId);
		if (!this.team) {
			throw this.errorHandler.error('notFound', { info: 'team' });
		}
		if (!(this.team.get('memberIds') || []).includes(this.user.id)) {
			throw this.errorHandler.error('createAuth', { reason: 'user not on team' });
		}
		this.attributes.companyId = this.team.get('companyId');
		this.repoAddedToTeam = true;
	}

	// get the company object for an existing team that the user is joining
	async getCompany () {
		if (!this.repoExisted || !this.userJoined) {
			return;
		}
		const company = await this.data.companies.getById(this.team.get('companyId'));
		this.attachToResponse.company = company.getSanitizedObject();
	}

	// get any team streams for an existing team that the user is joining
	async getTeamStreams () {
		if (!this.repoExisted || !this.userJoined) {
			return;
		}
		const streams = await this.data.streams.getByQuery(
			{
				teamId: this.team.id,
				type: 'channel',
				isTeamStream: true
			},
			{
				databaseOptions: {
					hint: StreamIndexes.byType 
				}
			}
		);
		this.attachToResponse.streams = streams.reduce((currentStreams, stream) => {
			if (!stream.get('deactivated')) {
				currentStreams.push(stream.getSanitizedObject());
			}
			return currentStreams;
		}, []);
	}

	// get all users on the team, for an existing team that the user is joining
	async getAllUsers () {
		if (!this.repoExisted || !this.userJoined) {
			return;
		}
		const users = await this.data.users.getByIds(this.team.get('memberIds'));
		this.attachToResponse.users = users.map(user => user.getSanitizedObject());
	}

	// get the existing members of a team
	async getExistingMembers () {
		this.existingUsers = await this.data.users.getByIds(this.team.get('memberIds'));
	}

	// for any users specified in the request, add them to the team that will own the repo
	async addUsersToTeam () {
		if (!(this.attributes.emails instanceof Array) &&
			!(this.attributes.users instanceof Array)) {
			return;
		}
		const adder = new AddTeamMembers({
			request: this.request,
			emails: this.attributes.emails,
			addUsers: this.attributes.users,
			team: this.team,
			subscriptionCheat: this.subscriptionCheat // allows unregistered users to subscribe to me-channel, needed for mock email testing
		});
		await adder.addTeamMembers();
		this.newUsers = adder.membersAdded;
		this.existingUsers = adder.existingMembers;
		this.attachToResponse.users = adder.membersAdded.map(member => member.getSanitizedObject());	// return the added users in the request response
		delete this.attributes.emails;
		delete this.attributes.users;
	}

	// create a new team to own this new repo
	async createTeamForRepo () {
		this.teamCreator = new TeamCreator({
			request: this.request,
			subscriptionCheat: this.subscriptionCheat, // allows unregistered users to subscribe to me-channel, needed for mock email testing
			fromRepoCreator: true	// only allow user creation/addition when creating a team from the POST /repos call
		});
		const team = await this.teamCreator.createTeam(this.attributes.team);
		this.attributes.teamId = team.id;
		this.attributes.companyId = team.get('companyId');
		// attach the team and company created, along with any users added to the team, to the request response
		this.attachToResponse.team = team.getSanitizedObject();
		this.attachToResponse.company = this.teamCreator.company.getSanitizedObject();
		this.attachToResponse.streams = [this.teamCreator.teamStream.getSanitizedObject()];
		this.newUsers = this.teamCreator.members;
		this.attachToResponse.users = this.teamCreator.members.map(member => member.getSanitizedObject());
		delete this.attributes.team;
		this.joinMethodUpdate = this.teamCreator.joinMethodUpdate;
		this.createdTeam = team;
	}

	// update the joinMethod attribute for the user, if this is their first team
	async updateUserJoinMethod () {
		// might already have a join method update, if we created a team
		if (this.joinMethodUpdate) {
			return;
		}
		// join method only applies if this is the user's first team
		if (
			this.user.get('teamIds').includes(this.attributes.teamId) &&
			this.user.get('teamIds').length > 1
		) {
			return;
		}

		// we can set both joinMethod and primaryReferral here
		this.joinMethodUpdate = { $set: { } };
		if (this.joinMethod && !this.user.get('joinMethod')) {
			this.joinMethodUpdate.$set.joinMethod = this.joinMethod;
		}
		if (this.primaryReferral && !this.user.get('primaryReferral')) {
			this.joinMethodUpdate.$set.primaryReferral = this.primaryReferral;
		}
		// if the user created this team, then their origin team is this one
		// but if the user joined this team, then their origin team is the
		// origin team of the creator of this team ... see COD-461
		if (!this.user.get('originTeamId')) {
			if (this.userJoined && this.originTeamId) {
				this.joinMethodUpdate.$set.originTeamId = this.originTeamId;
			}
			else if (this.createdTeam) {
				this.joinMethodUpdate.$set.originTeamId = this.attributes.teamId;
			}
		}
		if (Object.keys(this.joinMethodUpdate.$set).length === 0) {
			// nothing to update
			this.joinMethodUpdate = null;
			return;
		}
		await this.request.data.users.applyOpById(
			this.user.id,
			this.joinMethodUpdate
		);
	}

	// extract the name from the URL passed in
	async extractName () {
		const parsedPath = Path.parse(this.attributes.normalizedUrl);
		this.attributes.name = parsedPath.name;
	}

	// after the repo has been saved...
	async postSave () {
		// grant permission to any users on the team that owns this repo, to subscribe to the messager channel for this repo
		await this.grantUserMessagingPermissions();
		// send email to us that a new team has been created
		if (this.createdTeam && this.api.config.email.replyToDomain === 'prod.codestream.com') {
			this.api.services.email.queueEmailSend(
				{
					type: 'teamCreated',
					userId: this.user.id,
					teamName: this.createdTeam.get('name')
				},
				{
					request: this.request
				}
			);
		}
	}

	// grant permission to any users on the team that owns this repo, to subscribe to the messager channel for this repo
	async grantUserMessagingPermissions () {
		const granterOptions = {
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
		try {
			await new RepoSubscriptionGranter(granterOptions).grantToUsers();
		}
		catch (error) {
			throw this.errorHandler.error('repoMessagingGrant', { reason: error });
		}
	}
}

module.exports = RepoCreator;
