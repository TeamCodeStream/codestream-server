// handle the "PUT /xenv/change-email" request, to change a user's email across environments
 
'use strict';

const XEnvRequest = require('./xenv_request');
const UserIndexes = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules//users/indexes');
const UserErrors = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/users/errors');
const ModelSaver = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/model_saver');
const UserPublisher = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/users/user_publisher');

class ChangeEmailRequest extends XEnvRequest {

	constructor (options) {
		super(options);
		this.errorHandler.add(UserErrors);
	}

	// process the request...
	async process () {
		await this.requireAndAllow();
		await this.getUser();
		if (!this.user) { return; }
		await this.ensureUnique();
		await this.updateUser();
	}

	// require certain parameters, and discard unknown parameters
	async requireAndAllow () {
		await this.requireAllowParameters('body', {
			required: {
				string: ['email', 'toEmail'],
			},
		});
	}

	// get the user whose email is to be changed
	async getUser () {
		this.user = await this.data.users.getOneByQuery(
			{
				searchableEmail: decodeURIComponent(this.request.body.email).toLowerCase()
			},
			{
				hint: UserIndexes.bySearchableEmail
			}
		);
		
	}

	// ensure what the user wants to change their email address to, is unique for this
	// database, otherwise they can't do it
	async ensureUnique () {
		const user = await this.data.users.getOneByQuery(
			{
				searchableEmail: decodeURIComponent(this.request.body.toEmail).toLowerCase()
			},
			{
				hint: UserIndexes.bySearchableEmail
			}
		);
		if (user) {
			throw this.errorHandler.error('emailTaken');
		}
	}

	// update the user in the database with new email
	async updateUser () {
		const email = this.request.body.toEmail;
		const op = {
			$set: {
				email,
				searchableEmail: email.toLowerCase(),
				modifiedAt: Date.now()
			}
		};
		this.updateOp = await new ModelSaver({
			request: this,
			collection: this.data.users,
			id: this.user.id
		}).save(op);
	}

	// after the response has been sent
	async postProcess () {
		if (!this.user) { return; }
		// publish the change to the user's teams
		await new UserPublisher({
			user: this.user,
			data: this.updateOp,
			request: this,
			broadcaster: this.api.services.broadcaster
		}).publishUserToTeams();
	}
}

module.exports = ChangeEmailRequest;
