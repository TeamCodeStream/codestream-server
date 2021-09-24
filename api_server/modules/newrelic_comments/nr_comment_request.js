// base class for New Relic comment requests

const RestfulRequest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/restful_request');
const RestfulErrors = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/errors');
const AuthenticatorErrors = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/authenticator/errors');
const AddTeamMembers = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/teams/add_team_members');
const UserIndexes = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/users/indexes');
const UserCreator = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/users/user_creator');
const UserValidator = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/users/user_validator');
const ModelSaver = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/model_saver');
const PostErrors = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/posts/errors');

class NRCommentRequest extends RestfulRequest {

	constructor (options) {
		super(options);
		this.errorHandler.add(RestfulErrors);
		this.errorHandler.add(AuthenticatorErrors);
		this.errorHandler.add(PostErrors);
	}

	// authorize the client to make this request
	async authorize () {
		// we rely on a secret, known only to the New Relic server and the
		// API server ... disallowing arbitrary clients to call this request
		const secret = this.api.config.sharedSecrets.commentEngine;
		if (!secret) {
			throw this.errorHandler.error('readAuth', { reason: 'server is not configured to support the comment engine' });
		}

		if (this.request.headers['x-cs-newrelic-secret'] !== secret) {
			this.request.abortWith = 401;
			throw this.errorHandler.error('missingAuthorization');
		}

		this.headerAccountId = this.request.headers['x-cs-newrelic-accountid'];
		if (!this.headerAccountId) {
			this.request.abortWith = 401;
			throw this.errorHandler.error('missingAuthorization', { reason: 'account ID of the parent object is required in X-CS-NewRelic-AccountId' });
		}
		this.headerAccountId = parseInt(this.headerAccountId, 10);
	}

	// handle any mentions in the post
	async handleMentions (mentionedUsers) {
		this.mentionedUserIds = [];
		for (let mentionedUser of (mentionedUsers || [])) {
			const user = await this.findOrCreateUser(mentionedUser);
			this.users.push(user);
			this.mentionedUserIds.push(user.id);
			await this.addUserToTeam(user);
		}
	}

	// add the given user to the current team, as needed
	async addUserToTeam (user) {
		// if we didn't just create a team, and the user isn't a member, add them automagically
		if (!(user.get('teamIds') || []).includes(this.team.id)) {
			await new AddTeamMembers({
				request: this,
				addUsers: [user],
				team: this.team
			}).addTeamMembers();
			return await this.data.users.getById(user.id); // refetch to know the user is on the team, should just go to cache
		} else {
			return user;
		}
	}

	// find or create a user matching the email passed in
	async findOrCreateUser(userInfo) {
		// must have a valid email
		const { email, newRelicUserId } = userInfo;
		if (!email) {
			throw this.errorHandler.error('parameterRequired', { info: 'creator.email' });
		}
		const error = new UserValidator().validateEmail(email);
		if (error) {
			throw this.errorHandler.error('validation', { info: `email: ${error}` });
		}

		// see if the user already exists
		const user = await this.data.users.getOneByQuery(
			{
				searchableEmail: email.toLowerCase()
			},
			{
				hint: UserIndexes.bySearchableEmail
			}
		);
		if (!user) {
			// create a "faux" user, one who cannot login but stands in for the New Relic user
			return this.createFauxUser(userInfo);
		} else {
			if (newRelicUserId) {
				return await this.maybeUpdateUser(user, newRelicUserId);
			} else {
				return user;
			}
		}
	}

	// create a "faux" user (one who can't actually login) to stand in for the commenting user
	// we'll put them on a team if there is already one that owns the object to which the comment is attached,
	// or create a new team as needed
	async createFauxUser (userInfo) {
		const { email, fullName, newRelicUserId } = userInfo;
		const userData = { email };
		if (fullName) {
			userData.fullName = fullName;
		}

		const options = {
			request: this,
			userBeingAddedToTeamId: this.team ? this.team.id : undefined,
			externalUserId: `newrelic::${email}`,
			dontSetInviteCode: true,
			ignoreUsernameOnConflict: true
		};
		if (newRelicUserId) {
			options.providerIdentities = [`newrelic::${newRelicUserId}`];
		}

		// create the user
		return new UserCreator(options).createUser(userData);
	}

	// maybe update the user with a new New Relic user identity
	async maybeUpdateUser (user, newRelicUserId) {
		// look for any New Relic identities in the user's providerIdentities,
		// if they are not equal to the provided ID, eliminate them and replace with
		// the provided ID
		let identityChanged = false;
		let identityFound = false;
		const providerIdentities = user.get('providerIdentities') || [];
		for (let i = providerIdentities.length - 1; i >= 0; i--) {
			const match = providerIdentities[i].match(/^newrelic::(.+)$/);
			if (match && match[1]) {
				if (match[1] === newRelicUserId) {
					identityFound = true;
				} else {
					identityChanged = true;
					providerIdentities.splice(i, 1);
				}
			}
		}
		if (identityChanged || !identityFound) {
			providerIdentities.push(`newrelic::${newRelicUserId}`);
			user.set('providerIdentities', providerIdentities);
			const op = { $set: { providerIdentities } };
			const updateOp = await new ModelSaver({
				request: this,
				collection: this.data.users,
				id: user.id
			}).save(op);
			this.transforms.userUpdateIdentityOps = this.transforms.userUpdateIdentityOps || [];
			this.transforms.userUpdateIdentityOps.push(updateOp);
		}

		return user;
	}

	// publish any messages not handled by the post creator
	async publish () {
		return Promise.all((this.transforms.userUpdateIdentityOps || []).map(async op => {
			await this.publishUser(op);
		}));
	}

	// publish a user update message
	async publishUser (op) {
		const channel = `user-${op.id}`;
		const message = {
			requestId: this.request.id,
			user: op
		};
		try {
			await this.api.services.broadcaster.publish(
				message,
				channel,
				{ request: this }
			);
		}
		catch (error) {
			// this doesn't break the chain, but it is unfortunate...
			this.request.warn(`Could not publish user identity update message to user ${op.id}: ${JSON.stringify(error)}`);
		}
	}
}

module.exports = NRCommentRequest;
