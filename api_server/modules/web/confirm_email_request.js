// handle the "PUT /change-email-confirm" request to accept a token confirming
// a new email for a user

'use strict';

const WebRequestBase = require('./web_request_base');
const UserPublisher = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/users/user_publisher');
const AuthenticatorErrors = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/authenticator/errors');
const ModelSaver = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/model_saver');
const ErrorHandler = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/error_handler');
const WebErrors = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/web/errors');
const UserErrors = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/users/errors');
const UserIndexes = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/users/indexes');

class ConfirmEmailRequest extends WebRequestBase {

	constructor (options) {
		super(options);
		this.errorHandler.add(AuthenticatorErrors);
		this.errorHandler.add(UserErrors);
	}

	async authorize () {
		// only applies to the user in the token payload, no authorization required
	}

	// process the request....
	async process () {
		await this.requireAndAllow();	// require certain parameters, and discard unknown parameters
		await this.verifyToken();		// make sure the token is valid, and parse the payload
		await this.getUser();			// get the user associated with the ID in the token
		await this.validateToken();		// verify the token is not expired, per the most recently issued token
		await this.ensureUnique();		// ensure the email isn't already taken
		await this.updateUser();		// update the user object with the new email
		await this.updateUserInOtherEnvironments();	// if the user exists in other environments (regions, cells, etc.), update there as well
	}

	// require these parameters, and discard any unknown parameters
	async requireAndAllow () {
		await this.requireAllowParameters(
			'query',
			{
				required: {
					string: ['t']
				}
			}
		);
		this.token = this.request.query.t;
	}

	// parse and verify the passed token
	async verifyToken () {
		try {
			this.payload = this.api.services.tokenHandler.verify(this.token);
		}
		catch (error) {
			const message = typeof error === 'object' ? error.message : error;
			if (message === 'jwt expired') {
				throw this.errorHandler.error('tokenExpired');
			}
			else {
				throw this.errorHandler.error('tokenInvalid', { reason: message });
			}
		}
		if (this.payload.type !== 'email') {
			throw this.errorHandler.error('tokenInvalid', { reason: 'not an email token' });
		}
	}

	// get the user associated with the ID in the token payload
	async getUser () {
		if (!this.payload.uid) {
			throw this.errorHandler.error('tokenInvalid', { reason: 'no uid found in token' });
		}
		if (!this.payload.email) {
			throw this.errorHandler.error('tokenInvalid', { reason: 'no email found in token' });
		}
		this.user = await this.data.users.getById(this.payload.uid);
		if (!this.user) {
			throw this.errorHandler.error('tokenInvalid', { reason: 'user not found' });
		}
	}

	// verify the token is not expired, per the most recently issued token
	async validateToken () {
		const accessTokens = this.user.get('accessTokens') || {};
		const emailToken = accessTokens.email || {};
		if (!emailToken || !emailToken.minIssuance) {
			throw this.errorHandler.error('tokenInvalid', { reason: 'no issuance for email token found' });
		}
		if (emailToken.minIssuance > this.payload.iat * 1000) {
			throw this.errorHandler.error('tokenInvalid', { reason: 'a more recent email token has been issued' });
		}
	}

	// ensure the email that the user is changing to is not already an email in our system
	async ensureUnique () {
		// under ONE_USER_PER_ORG, users are only required to be unique within a company
		const oneUserPerOrg = (
			this.api.modules.modulesByName.users.oneUserPerOrg ||
			this.request.headers['x-cs-one-user-per-org']
		);

		const existingUsers = await this.data.users.getByQuery(
			{ searchableEmail: this.payload.email.toLowerCase() },
			{ hint: UserIndexes.bySearchableEmail }
		);

		// remove this check when we have fully moved to ONE_USER_PER_ORG
		if (oneUserPerOrg) {
			this.log('NOTE: doing check for uniqueness of email only in org in one-user-per-org'); 
			const teamIds = this.user.get('teamIds') || [];
			if (teamIds.length > 1) {
				// this shouldn't happen under one-user-per-org, but it's just a safeguard
				throw this.errorHandler.error('internal', { reason: 'user changing email in one-user-per-org, but belongs to more than one org' });
			}

			const teamId = teamIds[0];
			if (teamId && existingUsers.find(user => {
				return (
					!user.get('deactivated') &&
					(user.get('teamIds') || []).includes(teamId)
				);			
			})) {
				throw this.errorHandler.error('emailTaken', { info: this.request.body.email });
			}
		} else if (existingUsers.length > 0) {
			throw this.errorHandler.error('emailTaken', { info: this.request.body.email });
		}
	}

	// update the user in the database with new email
	async updateUser () {
		this.originalEmail = this.user.get('email');
		const op = {
			$set: {
				email: this.payload.email,
				searchableEmail: this.payload.email.toLowerCase(),
				modifiedAt: Date.now()
			}
		};
		this.updateOp = await new ModelSaver({
			request: this,
			collection: this.data.users,
			id: this.user.id
		}).save(op);
	}

	// if the user exists in other environments (regions, cells, etc.), update there as well
	async updateUserInOtherEnvironments () {
		return this.api.services.environmentManager.changeEmailInAllEnvironments(this.originalEmail, this.payload.email);
	}

	// handle the response to the request, overriding the base response to do a redirect
	async handleResponse () {
		if (this.gotError) {
			this.warn(ErrorHandler.log(this.gotError));
			const errorCode = typeof this.gotError === 'object' && this.gotError.code ? this.gotError.code : WebErrors['unknownError'].code;
			this.response.redirect(`/web/confirm-email-error?error=${errorCode}`);
		}
		else {
			this.response.redirect('/web/confirm-email-complete');
		}
	}

	// after the request returns a response....
	async postProcess () {
		// publish the updated user directive to all the team members
		await this.publishUserToTeams();

		// change the user's email in all foreign environments
		this.changeEmailAcrossEnvironments();
	}

	// publish the updated user directive to all the team members,
	// over the team channel
	async publishUserToTeams () {
		delete this.updateOp.$set.searchableEmail;
		await new UserPublisher({
			user: this.user,
			data: this.updateOp,
			request: this,
			broadcaster: this.api.services.broadcaster
		}).publishUserToTeams();
	}

	// change the user's email in all foreign environments
	async changeEmailAcrossEnvironments () {
		if (this.request.headers['x-cs-block-xenv']) {
			this.log('Not changing email across environments, blocked by header');
			return;
		}
		this.log(`Changing email ${this.originalEmail} to ${this.payload.email} in all environments`);
		return this.api.services.environmentManager.changeEmailInAllEnvironments(this.originalEmail, this.payload.email);
	}

}

module.exports = ConfirmEmailRequest;
