// handle the 'POST /users' request, to create (invite) a user (or fetch if user
// with same email already exists)

'use strict';

const PostRequest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/post_request');
const UserInviter = require('./user_inviter');
const IsCodeStreamOnly = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/companies/is_codestream_only');

class PostUserRequest extends PostRequest {

	async authorize () {
		// first, inviting user must be on the team
		await this.user.authorizeFromTeamId(this.request.body, this, { error: 'createAuth' });
		const teamId = decodeURIComponent(this.request.body.teamId).toLowerCase();
		this.team = await this.data.teams.getById(teamId);
		if (!this.team) {
			throw this.errorHandler.error('notFound', { info: 'team' });
		}

		/*
		// if the company is not a codestream-only company, which we'll verify through NR,
		// then no members can be invited, all member management happens through NR
		const company = await this.data.companies.getById(this.team.get('companyId'));
		const codestreamOnly = await IsCodeStreamOnly(company, this);
		if (!codestreamOnly) {
			await this.persist();
			await this.publishCompanyNoCSOnly();
			throw this.errorHandler.error('createAuth', { reason: 'member management for this company can only be done through New Relic' });
		}
		*/

		// then, if the onlyAdminsCanInvite team setting is set, then the user must be an admin for the team
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
		[
			'_confirmationCheat',
			'_subscriptionCheat',
			'_delayEmail',
			'inviteType',
			'dontSendEmail'
		].forEach(parameter => {
			this[parameter] = this.request.body[parameter];
			delete this.request.body[parameter];
		});

		await this.requireAllowParameters(
			'body',
			{
				required: {
					string: ['teamId', 'email']
				}
			}
		);
	}

	// invite the user, which will create them as needed, and add them to the team 
	async inviteUser () {
		this.log('NOTE: Inviting user under one-user-per-org paradigm');
		const inviterClass = UserInviter;
		this.userInviter = new inviterClass({
			request: this,
			team: this.team,
			delayEmail: this._delayEmail,
			inviteType: this.inviteType,
			user: this.user,
			dontSendEmail: this.dontSendEmail
		});

		const userData = {
			email: this.request.body.email.trim()
		};
		this.invitedUsers = await this.userInviter.inviteUsers([userData]);
		const invitedUserData = this.invitedUsers[0];
		this.transforms.createdUser = invitedUserData.user;
	}

	// form the response to the request
	async handleResponse () {
		if (this.gotError) {
			return super.handleResponse();
		}

		let user = this.transforms.createdUser;
		this.responseData = { user: user.getSanitizedObject() };

		return super.handleResponse();
	}

	// after the response has been sent...
	async postProcess () {
		await this.userInviter.postProcess();
	}

	// if the company object has changed (because it was found to no longer be "codestream only"),
	// publish the change to the team channel
	async publishCompanyNoCSOnly () {
		if (!this.transforms.updateCompanyNoCSOnly) {
			return;
		}

		// publish the change to all users on the "everyone" team
		const channel = 'team-' + this.team.id;
		const message = {
			company: this.transforms.updateCompanyNoCSOnly,
			requestId: this.request.id
		};;
		try {
			await this.api.services.broadcaster.publish(
				message,
				channel,
				{ request: this }
			);
		}
		catch (error) {
			// this doesn't break the chain, but it is unfortunate...
			this.warn(`Could not publish updated company message to team ${this.team.id}: ${JSON.stringify(error)}`);
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
		//description.errors.push('usernameNotUnique');
		return description;
	}
}

module.exports = PostUserRequest;
