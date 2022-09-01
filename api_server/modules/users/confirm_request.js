// handle "POST /no-auth/confirm" request to confirm registration for a user

'use strict';

const RestfulRequest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/restful_request');
const UserPublisher = require('./user_publisher');
const ConfirmHelper = require('./confirm_helper');
const Errors = require('./errors');
const AuthErrors = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/authenticator/errors');
const UserIndexes = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/users/indexes');

const MAX_CONFIRMATION_ATTEMPTS = 3;

class ConfirmRequest extends RestfulRequest {

	constructor (options) {
		super(options);
		this.errorHandler.add(Errors);
		this.errorHandler.add(AuthErrors);
		this.loginType = this.loginType || 'web';
	}

	async authorize () {
		// no-auth request, authorization is through the confirmation code
	}

	// process the request...
	async process () {
		await this.requireAndAllow();		// require parameters, and filter out unknown parameters
		await this.getUser();				// get the user indicated
		await this.checkAttributes();		// check the attributes provided in the request
		if (await this.verifyCode()) {		// verify the confirmation code is correct
			return await this.failedConfirmation();
		}
		await this.doConfirm();				// call out to confirm helper to finish the confirmation
	}

	// require certain parameters, and discard unknown parameters
	async requireAndAllow () {
		if (this.request.body.token) {
			throw this.errorHandler.error('deprecated', { reason: 'confirmation tokens are deprecated' });
		}
		await this.requireAllowParameters(
			'body',
			{
				required: {
					string: ['email', 'confirmationCode']
				},
				optional: {
					string: ['password', 'username', 'environment'],
					number: ['expiresIn', 'nrAccountId']
				}
			}
		);
	}

	// get the user associated with the given email
	async getUser () {
		const query = {
			searchableEmail: this.request.body.email.toLowerCase()
		};
		const users = await this.data.users.getByQuery(
			query,
			{ hint: UserIndexes.bySearchableEmail }
		);

		// return an already-registered error if there is a matching registered user,
		// otherwise look for an unregistered user that is not on any teams
		let teamlessUser;
		let userOnTeams;
		const registeredUser = users.find(user => {
			const teamIds = user.get('teamIds') || [];
			if (user.get('deactivated')) {
				return false;
			} else if (user.get('isRegistered')) {
				return true;
			} else if (teamIds.length === 0) {
				teamlessUser = user;
			} else {
				userOnTeams = user;
			}
		});

		// can't confirm an already-confirmed user
		if (registeredUser) {
			throw this.errorHandler.error('alreadyRegistered');
		// remove the check below once we have fully moved to ONE_USER_PER_ORG
		} else if (userOnTeams && !this.module.oneUserPerOrg) {
			this.user = userOnTeams;
		} else if (!teamlessUser) {
			throw this.errorHandler.error('notFound', { info: 'user' });
		} else {
			this.user = teamlessUser;
		}
	}

	// check that the given attributes match the user
	async checkAttributes () {
		// must provide a password for confirmation if we don't already have one
		if (!this.user.get('passwordHash') && !this.request.body.password) {
			throw this.errorHandler.error('parameterRequired', { info: 'password' });
		}
		// must provide a username for confirmation if we don't already have one
		if (!this.user.get('username') && !this.request.body.username) {
			throw this.errorHandler.error('parameterRequired', { info: 'username' });
		}
	}

	// verify the confirmation code given in the request against the one that was generated
	async verifyCode () {
		// we give the user 3 attempts to enter a confirmation code, after that, they'll
		// have to get a new confirmation email sent to them
		let confirmFailed = false;
		if (this.request.body.confirmationCode !== this.user.get('confirmationCode')) {
			confirmFailed = true;
			if (this.user.get('confirmationAttempts') === MAX_CONFIRMATION_ATTEMPTS) {
				this.maxConfirmationAttempts = true;
			}
			this.trackFailureEvent('Incorrect Code');
		}
		else if (Date.now() > this.user.get('confirmationCodeExpiresAt')) {
			confirmFailed = true;
			this.confirmationExpired = true;
			this.trackFailureEvent('Expired');
		}
		return confirmFailed; // if true, shortcuts and prepares for failure response
	}

	// call out to a confirmation helper, to finish the confirmation
	async doConfirm () {
		const nrAccountId = this.request.body.nrAccountId;
		delete this.request.body.nrAccountId;
		const environment = this.request.body.environment;
		delete this.request.body.environment;
		this.responseData = await new ConfirmHelper({
			request: this,
			user: this.user,
			loginType: this.loginType,
			nrAccountId,
			environment
		}).confirm(this.request.body);
	}

	// user failed confirmation for whatever reason, we'll do a database update
	// and return the appropriate error in the response
	async failedConfirmation () {
		await this.updateUserConfirmationFailed();
		if (this.maxConfirmationAttempts) {
			throw this.errorHandler.error('tooManyConfirmAttempts');
		}
		else if (this.confirmationExpired) {
			throw this.errorHandler.error('confirmCodeExpired');
		}
		else {
			throw this.errorHandler.error('confirmCodeMismatch');
		}
	}

	// update the user's record in the database indicating a confirmation failure
	async updateUserConfirmationFailed () {
		let set = {};
		if (this.maxConfirmationAttempts || this.confirmationExpired) {
			set.confirmationCode = null;
			set.confirmationAttempts = 0;
			set.confirmationCodeExpiresAt = null;
		}
		else {
			set.confirmationAttempts = this.user.get('confirmationAttempts') + 1;
		}
		await this.data.users.updateDirect(
			{ id: this.data.users.objectIdSafe(this.user.id) },
			{ $set: set }
		);
	}

	async handleResponse () {
		if (this.gotError) {
			return await super.handleResponse();
		}
		// get the user again since it was changed, this should fetch from cache and not from database
		this.user = await this.data.users.getById(this.user.id);
		this.responseData.user = this.user.getSanitizedObjectForMe({ request: this });
		await super.handleResponse();
	}

	// after the request returns a response....
	async postProcess () {
		// publish the now-registered-and-confirmed user to all the team members
		await this.publishUserToTeams();
	}

	// publish the now-registered-and-confirmed user to all the team members,
	// over the team channel
	async publishUserToTeams () {
		await new UserPublisher({
			user: this.user,
			data: this.user.getSanitizedObject({ request: this }),
			request: this,
			broadcaster: this.api.services.broadcaster
		}).publishUserToTeams();
	}

	// track a confirmation failure for analytics
	async trackFailureEvent (failureEvent) {
		if (!this.user) { return; }
		const trackObject = {
			Error: failureEvent,
			'email': this.user.get('email')
		};
		this.api.services.analytics.track(
			'Email Confirmation Failed',
			trackObject,
			{
				request: this,
				user: this.user
			}
		);
	}

	// describe this route for help
	static describe () {
		return {
			tag: 'confirm',
			summary: 'Confirms a user\'s registration',
			access: 'No authorization needed, though the correct confirmation code must be correct',
			description: 'Confirms a user\'s registration with confirmation code',
			input: {
				summary: 'Specify attributes in the body; email and confirmation code must be provided',
				looksLike: {
					'email*': '<User\'s email>',
					'confirmationCode*': '<Confirmation code (sent via email to the user\'s email after initial registration)>',
					'password': '<Can optionally set the user\'s password here>',
					'username': '<Can optionally set the user\'s username here>'
				}
			},
			returns: {
				summary: 'Returns an updated user object, plus access token and PubNub subscription key, and teams the user is on as well as repos owned by those teams',
				looksLike: {
					user: '<@@#user object#user@@>',
					accessToken: '<user\'s access token, to be used in future requests>',
					pubnubKey: '<subscribe key to use for connecting to PubNub>',
					pubnubToken: '<user\'s token for subscribing to PubNub channels>',
					providers: '<info structures with available third-party providers>',
					broadcasterToken: '<user\'s token for subscribing to real-time messaging channels>',
					teams: [
						'<@@#team object#team@@>',
						'...'
					],
					repos: [
						'<@@#repo object#repo@@>',
						'...'
					]
				}
			},
			publishes: {
				summary: 'Publishes the updated user object on the team channel for each team the user is on.',
				looksLike: {
					user: '<@@#user object#user@@>'
				}
			},
			errors: [
				'parameterRequired',
				'notFound',
				'alreadyRegistered',
				'emailMismatch',
				'tooManyConfirmAttempts',
				'confirmCodeExpired',
				'confirmCodeMismatch'
			]
		};
	}
}

module.exports = ConfirmRequest;
