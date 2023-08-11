// this class should be used to create all team documents in the database

'use strict';

const ModelCreator = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/model_creator');
const Team = require('./team');
const CodeStreamModelValidator = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/models/codestream_model_validator');
const TeamSubscriptionGranter = require('./team_subscription_granter');
const TeamAttributes = require('./team_attributes');
const Errors = require('./errors');
const StreamCreator = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/streams/stream_creator');
const ModelSaver = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/model_saver');
const DefaultTags = require('./default_tags');
const DeepClone = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/deep_clone');
const UserCreator = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/users/user_creator');
const ConfirmHelper = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/users/confirm_helper');
const AddTeamMembers = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/teams/add_team_members');
const UserAttributes = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/users/user_attributes');
const ObjectId = require('mongodb').ObjectId;

class TeamCreator extends ModelCreator {

	constructor (options) {
		super(options);
		this.errorHandler.add(Errors);
	}

	get modelClass () {
		return Team;	// class to use to create a team model
	}

	get collectionName () {
		return 'teams';	// data collection to use
	}

	// convenience wrapper
	async createTeam (attributes) {
		return await this.createModel(attributes);
	}

	// get attributes that are required for team creation, and those that are optional,
	// along with their types
	getRequiredAndOptionalAttributes () {
		return {
			required: {
				string: ['name']
			},
			optional: {
				string: ['companyId'],
				object: ['company']
			}
		};
	}

	// validate attributes for the team we are creating
	async validateAttributes () {
		this.attributes.isEveryoneTeam = this.isEveryoneTeam; // don't allow to be set by client
		this.validator = new CodeStreamModelValidator(TeamAttributes);
		return this.validateName();
	}

	// validate the name attribute
	validateName () {
		let error = this.validator.validateString(this.attributes.name);
		if (error) {
			return { name: error };
		}
	}

	// called before the team is actually saved
	async preSave () {
		const teamIds = this.user.get('teamIds') || [];

		// under one-user-per-org, create a duplicate of the creator if they are already on a team
		if (teamIds.length > 0) { 
			this.request.log('NOTE: duplicating user under one-user-per-org');
			await this.duplicateUser();
		}
		
		this.createId();
		this.attributes.createdAt = Date.now();
		this.attributes.creatorId = this.user.id;	// user making the request is the team creator
		this.attributes.memberIds = [this.user.id];	// user creating the team should always be a member
		this.attributes.adminIds = [this.user.id];	// user creating the team becomes its administrator
		this.attributes.tags = DeepClone(DefaultTags);	// default tags for codemarks

		// allow third-party provider related attributes to be set by caller
		['providerInfo', 'providerIdentities'].forEach(attribute => {
			if (this[attribute]) {
				this.attributes[attribute] = this[attribute];
			}
		});

		// set some analytics, based on whether this is the user's first team
		const originalUser = this.originalUser || this.user;
		const firstTeamForUser = (originalUser.get('teamIds') || []).length === 0;
		this.attributes.primaryReferral = firstTeamForUser ? 'external' : 'internal';

		if (this.request.isForTesting()) { // special for-testing header for easy wiping of test data
			this.attributes._forTesting = true;
		}

		await this.createOrAttachToCompany();	// create a company along with the team, or attach to an existing company
		await this.createTeamStream();		// create a stream for the entire team
		await super.preSave();
	}

	// under one-user-per-org, we create a duplicate user record as the company/team creator
	async duplicateUser () {
		const userData = {
			copiedFromUserId: this.user.id,
			joinMethod: 'Created Team'
		};
		const attributesToCopy = Object.keys(UserAttributes).filter(attr => {
			return UserAttributes[attr].copyOnInvite;
		});
		attributesToCopy.forEach(attribute => {
			const value = this.user.get(attribute);
			if (value !== undefined) {
				userData[attribute] = value;
			}
		});

		// don't duplicate providerInfo data specific to a team, we identity these by checking if
		// we can create a legitimate mongo ID out of the key
		if (userData.providerInfo) {
			userData.providerInfo = DeepClone(userData.providerInfo);
			Object.keys(userData.providerInfo).forEach(key => {
				try { 
					ObjectId(key); 
					delete userData.providerInfo[key];
				} catch (e) {
				}
			});
		}

		this.originalUser = this.user;
		this.transforms.createdUser = this.user = await new UserCreator({ 
			request: this.request,
			force: true
		}).createUser(userData);
	}

	// create a company document for the team, or if the company ID is provided, update the company
	async createOrAttachToCompany () {
		if (this.attributes.companyId) {
			if (!this.dontAttachToCompany) {
				throw this.errorHandler.error('deprecated', { reason: 'multiple teams within a company are deprecated' });
				//return this.attachToCompany();
			} 
		}
		else {
			throw this.errorHandler.error('deprecated', { reason: 'company creation within team creation is deprecated' });
			//return this.createCompany();
		} 
	}

	// create a stream for the entire team, everyone on the team is always a member of this stream
	async createTeamStream () {
		let stream = {
			teamId: this.attributes.id,
			type: 'channel',
			name: 'general',
			isTeamStream: true
		};
		this.transforms.createdTeamStream = await new StreamCreator({
			request: this.request,
			nextSeqNum: this.assumeTeamStreamSeqNum || undefined
		}).createStream(stream);
	}

	// after the team has been saved...
	async postSave () {
		await super.postSave();
		await this.updateUser();	// update the current user to indicate they are a member of the team
		await this.grantUserMessagingPermissions();		// grant permission to the team creator to subscribe to the team broadcaster channel

		if (this.originalUser) {
			// under one-user-per-org, if this wasn't the user's first team/company, 
			// the duplicated user needs to be confirmed, and added to the everyone team
			await this.confirmUser();
			await this.addUserToTeam();
		}
	}

	// update a user to indicate they have been added to a new team
	async updateUser () {
		if (this.originalUser) { return; } 

		// add the team's ID to the user's teamIds array, and the company ID to the companyIds array
		const op = {
			$addToSet: {
				companyIds: this.attributes.companyId,
				teamIds: this.model.id
			},
			$set: {
				modifiedAt: Date.now()
			}
		};
		this.updateUserJoinMethod(this.user, op);
		this.transforms.userUpdate = await new ModelSaver({
			request: this.request,
			collection: this.data.users,
			id: this.user.id
		}).save(op);
	}

	// update the joinMethod attribute for the user, if this is their first team
	updateUserJoinMethod (user, op) {
		// join method only applies if this is the user's first team
		const teamIds = user.get('teamIds') || [];
		if (teamIds.length > 0) {
			return;
		}

		// we can set both joinMethod and primaryReferral here
		const set = {};
		if (!user.get('joinMethod')) {
			set.joinMethod = 'Created Team';
		}
		if (!user.get('primaryReferral')) {
			set.primaryReferral = 'external';
		}
		// user created this team, so their origin team is this one if one isn't defined already
		if (!user.get('originTeamId')) {
			set.originTeamId = this.model.id;
		}
		if (Object.keys(set).length === 0) {
			// nothing to update
			return;
		}

		op.$set = op.$set || {};
		Object.assign(op.$set, set);
	}

	// grant permission to the team creator to subscribe to the team broadcaster channel
	async grantUserMessagingPermissions () {
		const granterOptions = {
			data: this.data,
			broadcaster: this.api.services.broadcaster,
			team: this.model,
			members: [this.user],
			request: this.request
		};
		try {
			await new TeamSubscriptionGranter(granterOptions).grantToMembers();
		}
		catch (error) {
			throw this.errorHandler.error('teamMessagingGrant', { reason: error });
		}
	}

	// under one-user-per-org, accepting an invite means confirming the user record for the unregistered
	// user who has been created as a result of the invite
	async confirmUser () {
		this.transforms.additionalCompanyResponse = await new ConfirmHelper({
			request: this.request,
			user: this.user,
			notRealLogin: true
		}).confirm({
			email: this.user.get('email')
		});

		Object.assign(this.transforms.additionalCompanyResponse, {
			userId: this.user.id,
			teamId: this.attributes.id
		});
		
		if (this.request.request.headers['x-cs-confirmation-cheat'] === this.api.config.sharedSecrets.confirmationCheat) {
			this.warn('NOTE: passing user object back in POST /companies request, this had better be a test!');
			this.transforms.additionalCompanyResponse.user = this.user.getSanitizedObject({ request: this });
		}
	}

	async addUserToTeam () {
		// add the newly duplicated user to the everyone team for the company
		return new AddTeamMembers({
			request: this,
			addUsers: [this.user],
			team: this.model,
			joinMethod: 'Created Team'
		}).addTeamMembers();
	}
}

module.exports = TeamCreator;
