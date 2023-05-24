// base class for New Relic comment requests

const RestfulRequest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/restful_request');
const RestfulErrors = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/errors');
const AuthenticatorErrors = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/authenticator/errors');
const CodeErrorIndexes = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/code_errors/indexes');
const UserIndexes = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/users/indexes');
const UserCreator = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/users/user_creator');
const UserValidator = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/users/user_validator');
const ModelSaver = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/model_saver');
const PostErrors = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/posts/errors');
const ArrayUtilities = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/array_utilities');
const PostCreator = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/posts/post_creator');

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
		const secretsList = this.api.config.sharedSecrets.commentEngineSecrets;
		if (!secretsList.length) {
			throw this.errorHandler.error('readAuth', { reason: 'server is not configured to support the comment engine' });
		}

		if(secretsList.indexOf(this.request.headers['x-cs-newrelic-secret']) < 0) {
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

	// handle fetching existing code error, as needed
	async checkForExistingCodeError () {
		const { objectId, objectType } = this.request.body;
		this.codeError = await this.data.codeErrors.getOneByQuery(
			{ objectId, objectType },
			{ hint: CodeErrorIndexes.byObjectId }
		);
		if (this.codeError && this.headerAccountId !== this.codeError.get('accountId')) {
			throw this.errorHandler.error('createAuth', { reason: 'accountId given in the header does not match the object' });
		}
		if (this.codeError && this.codeError.get('accountId') !== this.request.body.accountId) {
			throw this.errorHandler.error('createAuth', { reason: 'accountId for the comment does not match the accountId of the parent object' });
		}
		if (!this.codeError && this.request.body.accountId !== this.headerAccountId) {
			throw this.errorHandler.error('createAuth', { reason: 'accountId given in the header does not match that given in the body' });
		}
	}

	// handle any mentions in the post
	async handleMentions (mentionedUsers) {
		this.mentionedUserIds = [];
		for (let mentionedUser of (mentionedUsers || [])) {
			const user = await this.findOrCreateUser(mentionedUser);
			this.users.push(user);
			this.mentionedUserIds.push(user.id);
		}
	}

	// find or create a user matching the email passed in
	async findOrCreateUser(userInfo, field = 'creator.email') {
		// must have a valid email
		const { email, newRelicUserId } = userInfo;
		if (!email) {
			throw this.errorHandler.error('parameterRequired', { info: field });
		}
		const error = new UserValidator().validateEmail(email);
		if (error) {
			throw this.errorHandler.error('validation', { info: `${field}: ${error}` });
		}

		// see if the user already exists
		const users = await this.data.users.getByQuery(
			{
				searchableEmail: email.toLowerCase()
			},
			{
				hint: UserIndexes.bySearchableEmail
			}
		);

		// under one-user-per-org, a matching user only exists if they are on the same team as
		// the owner of the existing code error, if any, or are already a teamless, faux user
		let user = users.find(u => {
			const teamIds = u.get('teamIds') || [];
			const codeErrorTeamId = this.codeError ? this.codeError.get('teamId') : undefined;
			return (
				(
					codeErrorTeamId &&
					teamIds.includes(codeErrorTeamId)
				) ||
				(
					teamIds.length === 0 &&
					(u.get('externalUserId') || '').match(/^newrelic::/)
				)
			);
		});

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

	// resolve the requesting user, which may involve creating a (faux) user
	async resolveUser () {
		// find or create a "faux" user, as needed
		this.user = this.request.user = await this.findOrCreateUser(this.request.body.creator);
		this.users.push(this.user);
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
			externalUserId: `newrelic::${email}`
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

	// create a code error linked to the New Relic object to which the comment is attached
	async createCodeError (options) {
		const { body, replyIsComing } = options;
		const { objectId, objectType, accountId, createdAt, modifiedAt } = body;

		// now create a post in the stream, along with the code error,
		// this will also create a stream for the code error
		const codeErrorAttributes = { objectId, objectType, accountId };
		const postAttributes = {
			dontSendEmail: true,
			codeError: codeErrorAttributes
		};
		postAttributes.codeError._fromNREngine = postAttributes._fromNREngine = true;
		if (this.request.headers['x-cs-newrelic-migration']) {
			postAttributes.codeError._forNRMigration = postAttributes._forNRMigration = true;
		}

		this.codeErrorPost = await new PostCreator({
			request: this,
			assumeSeqNum: 1,
			replyIsComing,
			users: this.users,
			setCreatedAt: createdAt,
			setModifiedAt: modifiedAt,
			forCommentEngine: true
		}).createPost(postAttributes);
		this.codeError = this.transforms.createdCodeError;
		this.stream = this.transforms.createdStreamForCodeError;
		this.codeErrorWasCreated = true;
	}

	// publish any messages not handled by the post creator
	async publish () {
		await Promise.all((this.transforms.userUpdateIdentityOps || []).map(async op => {
			await this.publishUser(op);
		}));

		if (this.transforms.updateTeamOp) {
			await this.publishTeam(this.transforms.updateTeamOp);
		}
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

	// publish a team update message
	async publishTeam (op) {
		const channel = `team-${op.id}`;
		const message = {
			requestId: this.request.id,
			team: op
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
			this.request.warn(`Could not publish team update message to team ${op.id}: ${JSON.stringify(error)}`);
		}
	}

	// get the IDs of all users associated with a post
	getUserIdsByPost (post) {
		let userIds = [
			post.get('creatorId'),
			...(post.get('mentionedUserIds') || [])
		];

		const reactions = post.get('reactions') || {};
		Object.keys(reactions).forEach(reaction => {
			userIds.push.apply(userIds, reactions[reaction]);
		});

		return userIds;
	}

	// get all users associated with a post
	async getUsersByPost (post) {
		let userIds = this.getUserIdsByPost(post);
		userIds = ArrayUtilities.unique(userIds);
		return this.data.users.getByIds(userIds);
	}

	// for codemarks, get the associated markers
	async getMarkers () {
		if (!this.post.get('codemarkId')) { return; }
		this.codemark = await this.data.codemarks.getById(this.post.get('codemarkId'));
		if (!this.codemark) {
			throw this.errorHandler.error('notFound', { info: 'codemark' });
		}
		if ((this.codemark.get('markerIds') || []).length > 0) {
			this.markers = await this.data.markers.getByIds(this.codemark.get('markerIds'));
		}
	}

	// update the team that owns the code error, if any, to reflect any foreign users added
	async updateTeam () {
		const teamId = this.codeError && this.codeError.get('teamId');
		if (!teamId) { return; }

		const team = await this.data.teams.getById(teamId);
		if (!team) {
			throw this.errorHandler.error('notFound', { info: 'team' });
		}
		const teamMemberIds = team.get('memberIds') || [];
		const teamForeignMemberIds = team.get('foreignMemberIds') || [];

		const userIds = [];
		if (this.user) {
			userIds.push(this.user.id);
		}
		if (this.mentionedUserIds) {
			userIds.push.apply(userIds, this.mentionedUserIds);
		}

		let foreignMemberIds = userIds.filter(userId => {
			const user = this.users.find(u => u.id === userId);
			return (
				!user || 
				(
					!teamMemberIds.includes(userId) &&
					!teamForeignMemberIds.includes(userId)
				)
			);
		});

		if (foreignMemberIds.length > 0) {
			const op = {
				$addToSet: {
					memberIds: foreignMemberIds,
					foreignMemberIds
				},
				$set: {
					modifiedAt: Date.now()
				}
			};
			this.transforms.updateTeamOp = await new ModelSaver({
				request: this,
				collection: this.data.teams,
				id: teamId
			}).save(op);
		}
	}
}

module.exports = NRCommentRequest;
