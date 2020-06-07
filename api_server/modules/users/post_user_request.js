// handle the 'POST /users' request, to create (invite) a user (or fetch if user
// with same email already exists)

'use strict';

const PostRequest = require(process.env.CS_API_TOP + '/lib/util/restful/post_request');
const UserInviter = require('./user_inviter');

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
		await this.inviteUser();
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
					object: ['inviteInfo'],
					boolean: ['dontSendEmail']
				}
			}
		);
		this.dontSendEmail = !!this.request.body.dontSendEmail;
		delete this.request.body.dontSendEmail;
		this.inviteInfo = this.request.body.inviteInfo;
	}

	// invite the user, which will create them as needed, and add them to the team 
	async inviteUser () {
		this.userInviter = new UserInviter({
			request: this,
			team: this.team,
			subscriptionCheat: this._subscriptionCheat, // allows unregistered users to subscribe to me-channel, needed for mock email testing
			inviteCodeExpiresIn: this._inviteCodeExpiresIn,
			delayEmail: this._delayEmail,
			inviteInfo: this.inviteInfo,
			user: this.user,
			dontSendEmail: this.dontSendEmail
		});

		const userData = {
			email: this.request.body.email
		};
		['fullName', '_pubnubUuid'].forEach(attribute => {
			if (this.request.body[attribute]) {
				userData[attribute] = this.request.body[attribute];
			}
		});
		this.invitedUsers = await this.userInviter.inviteUsers([userData]);
		this.invitedUserData = this.invitedUsers[0];
		this.transforms.createdUser = this.invitedUserData.user;
		this.inviteCode = this.invitedUserData.inviteCode;
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
		if (this._confirmationCheat === this.api.config.secrets.confirmationCheat) {
			this.responseData.inviteCode = this.inviteCode;
		}
		await super.handleResponse();
	}

	// after the response has been sent...
	async postProcess () {
		return this.userInviter.postProcess();
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
