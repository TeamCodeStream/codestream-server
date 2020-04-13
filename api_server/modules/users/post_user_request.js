// handle the 'POST /users' request, to create (invite) a user (or fetch if user
// with same email already exists)

'use strict';

const PostRequest = require(process.env.CS_API_TOP + '/lib/util/restful/post_request');
const AddTeamMember = require(process.env.CS_API_TOP + '/modules/teams/add_team_member');
const AddTeamPublisher = require('./add_team_publisher');
const { awaitParallel } = require(process.env.CS_API_TOP + '/server_utils/await_utils');
const UserCreator = require(process.env.CS_API_TOP + '/modules/users/user_creator');
const SecretsConfig = require(process.env.CS_API_TOP + '/config/secrets');
const ModelSaver = require(process.env.CS_API_TOP + '/lib/util/restful/model_saver');

class PostUserRequest extends PostRequest {

	async authorize () {
		// first, inviting user must be on the team
		await this.user.authorizeFromTeamId(this.request.body, this, { error: 'createAuth' });

		// then, if the onlyAdminsCanInvite team setting is set, then the user must be an admin for the team
		const teamId = decodeURIComponent(this.request.body.teamId).toLowerCase();
		this.team = await this.data.teams.getById(teamId);
		if (!this.team) {
			throw this.errorHandler.error('notFound', { info: 'team' });
		}
		if (
			(this.team.get('settings') || {}).onlyAdminsCanInvite &&
			!(this.team.get('adminIds') || []).includes(this.user.id)
		) {
			throw this.errorHandler.error('createAuth', { reason: 'only admins can invite users to this team' });
		}
	}

	// process the request...
	async process () {
		// totally pre-empt the restful creation of a model out of the box ... instead
		// what we're doing here is adding them to a team, and that flow will actually
		// create the user as needed
		await this.requireAndAllow();
		await this.createUser();
		await this.addToTeam();
		await this.setNumInvited();
	}

	// require certain parameters, and discard unknown parameters
	async requireAndAllow () {
		// many attributes that are allowed but don't become attributes of the created user
		['_confirmationCheat', '_subscriptionCheat', '_delayEmail', '_inviteCodeExpiresIn'].forEach(parameter => {
			this[parameter] = this.request.body[parameter];
			delete this.request.body[parameter];
		});

		await this.requireAllowParameters(
			'body',
			{
				required: {
					string: ['teamId', 'email']
				},
				optional: {
					string: ['_pubnubUuid', 'fullName'],
					boolean: ['dontSendEmail']
				}
			}
		);
		this.dontSendEmail = !!this.request.body.dontSendEmail;
	}

	// create the user, if needed
	async createUser () {
		this.userCreator = new UserCreator({
			request: this,
			teamIds: [this.team.id],
			subscriptionCheat: this._subscriptionCheat, // allows unregistered users to subscribe to me-channel, needed for mock email testing
			userBeingAddedToTeamId: this.team.id,
			inviteCodeExpiresIn: this._inviteCodeExpiresIn
		});
		const userData = {
			email: this.request.body.email
		};
		['fullName', '_pubnubUuid'].forEach(attribute => {
			if (this.request.body[attribute]) {
				userData[attribute] = this.request.body[attribute];
			}
		});
		this.transforms.createdUser = await this.userCreator.createUser(userData);
		this.wasOnTeam = this.userCreator.existingModel && this.userCreator.existingModel.hasTeam(this.team.id);
	}

	// add the passed user to the team indicated, this will create the user as needed
	async addToTeam () {
		if (this.transforms.createdUser.hasTeam()) {
			// don't send an invite email to a registered user who is already on the team
			this.dontSendEmail = this.dontSendEmail || this.transforms.createdUser.get('isRegistered');
			return;
		}
		await new AddTeamMember({
			request: this,
			addUser: this.transforms.createdUser,
			team: this.team,
			subscriptionCheat: this._subscriptionCheat // allows unregistered users to subscribe to me-channel, needed for mock email testing
		}).addTeamMember();
		// refetch the user since they changed when added to team
		this.transforms.createdUser = await this.data.users.getById(this.transforms.createdUser.id);
	}

	// track the number of users the inviting user has invited
	async setNumInvited () {
		if (this.wasOnTeam) { return; } // don't bother if the user was already invited
		const op = {
			$set: {
				numUsersInvited: (this.user.get('numUsersInvited') || 0) + 1,
				modifiedAt: Date.now()
			}
		};
		this.transforms.invitingUserUpdateOp = await new ModelSaver({
			request: this,
			collection: this.data.users,
			id: this.user.id
		}).save(op);
	}

	// form the response to the request
	async handleResponse () {
		if (this.gotError) {
			return super.handleResponse();
		}
		// get the user again because the user object would've been modified when added to the team,
		// this should just fetch from the cache, not from the database
		const user = await this.data.users.getById(this.transforms.createdUser.id);
		this.responseData = { user: user.getSanitizedObject() };

		// send invite code in the response, for testing purposes
		if (this._confirmationCheat === SecretsConfig.confirmationCheat) {
			this.responseData.inviteCode = this.userCreator.inviteCode;
		}
		await super.handleResponse();
	}

	// after the response has been sent...
	async postProcess () {
		await awaitParallel([
			this.publishAddToTeam,
			this.sendInviteEmail,
			//this.trackInvite,
			this.updateInvites,
			this.publishNumUsersInvited
		], this);
	}

	// publish to the team that the user has been added,
	// and publish to the user that they've been added to the team
	async publishAddToTeam () {
		// get the team again since the team object has been modified,
		// this should just fetch from the cache, not from the database
		const team = await this.data.teams.getById(this.team.id);
		await new AddTeamPublisher({
			request: this,
			broadcaster: this.api.services.broadcaster,
			user: this.transforms.createdUser,
			team: team,
			teamUpdate: this.transforms.teamUpdate,
			userUpdate: this.transforms.userUpdate
		}).publishAddedUser();
	}

	// send an invite email to the added user
	async sendInviteEmail () {
		if (this.dontSendEmail) {
			return; // don't send email if this flag is set
		}
		if (this._delayEmail) {	// allow client to delay the email send, for testing purposes
			setTimeout(this.sendInviteEmail.bind(this), this._delayEmail);
			delete this._delayEmail;
			return;
		}

		// don't send an email if invited user is already registered and already on a team
		const user = this.transforms.createdUser;
		if (user.get('isRegistered') && this.wasOnTeam) {
			return;
		}

		// queue invite email for send by outbound email service
		this.log(`Triggering invite email to ${user.get('email')}...`);
		await this.api.services.email.queueEmailSend(
			{
				type: 'invite',
				userId: user.id,
				inviterId: this.user.id,
				teamName: this.team.get('name'),
				//checkOutLink
			},
			{
				request: this,
				user
			}
		);
	}

	// track this invite for analytics
	async trackInvite () {
		if (this.dontSendEmail) {
			return; // don't track invite email if we're not sending an email
		}

		const company = await this.data.companies.getById(this.team.get('companyId'));
		const invitingUser = this.user;
		const invitedUser = this.transforms.createdUser;
		const firstSessionStartedAt = invitingUser.get('firstSessionStartedAt');
		const FIRST_SESSION_TIMEOUT = 12 * 60 * 60 * 1000;
		const firstSession = firstSessionStartedAt && firstSessionStartedAt < Date.now() + FIRST_SESSION_TIMEOUT; 
		const trackData = {
			'Invitee Email Address': invitedUser.get('email'),
			'First Invite': !invitedUser.get('numInvites'),
			'Registered': !!invitedUser.get('isRegistered'),
			'Endpoint': this.request.headers['x-cs-plugin-ide'] || 'Unknown IDE',
			'Plugin Version': this.request.headers['x-cs-plugin-version'] || '',
			'First Session': firstSession
		};

		const trackOptions = {
			request: this,
			user: invitingUser,
			team: this.team,
			company
		};

		this.api.services.analytics.trackWithSuperProperties(
			'Team Member Invited',
			trackData,
			trackOptions
		);
	}

	// for an unregistered user, we track that they've been invited
	// and how many times for analytics purposes
	async updateInvites () {
		if (this.dontSendEmail) {
			return; // don't update invites if this flag is set
		}
		const user = this.transforms.createdUser;
		if (user.get('isRegistered')) {
			return;	// we only do this for unregistered users
		}
		const update = {
			$set: {
				internalMethod: 'invitation',
				internalMethodDetail: this.user.id
			},
			$inc: {
				numInvites: 1
			}
		};
		await this.data.users.updateDirect(
			{ id: this.data.users.objectIdSafe(user.id) },
			update
		);
	}

	// if inviting user has numUsersInvited incremented, publish it
	async publishNumUsersInvited () {
		if (!this.transforms.invitingUserUpdateOp) { return; }
		const channel = 'user-' + this.user.id;
		const message = {
			user: this.transforms.invitingUserUpdateOp,
			requestId: this.request.id
		};
		try {
			await this.api.services.broadcaster.publish(
				message,
				channel,
				{ request: this }
			);
		}
		catch (error) {
			// this doesn't break the chain, but it is unfortunate
			this.warn(`Unable to publish inviting user update message to channel ${channel}: ${JSON.stringify(error)}`);
		}
	}

	// describe this route for help
	static describe (module) {
		const description = PostRequest.describe(module);
		description.description = 'Creates a user with the given email, or finds the existing user with that email, and puts that user on the team specified. Also sends the user an invite email, unless the dontSendEmail flag is set.';
		description.access = 'Current user must be a member of the team they are putting the created or found user on';
		description.input = {
			summary: description.input,
			looksLike: {
				'teamId*': '<ID of the team onto which the user should be put>',
				'email*': '<Email of the user to be created or found>',
				'dontSendEmail': '<If set to true, an invite email will not be sent to the user>'
			}
		};
		description.returns.summary = 'The user object for the created or found user';
		Object.assign(description.returns.looksLike, {
			user: '<@@#user object#user@@>'
		});
		description.publishes = {
			summary: 'The user object will be published on the team channel for the team that the user was added to.',
			looksLike: {
				user: '<@@#user object#user@@>'
			}
		};
		description.errors.push('usernameNotUnique');
		return description;
	}
}

module.exports = PostUserRequest;
