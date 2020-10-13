// handle the PUT /users request to edit attributes of a user

'use strict';

const PutRequest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/put_request');
const UserPublisher = require('./user_publisher');

class PutUserRequest extends PutRequest {

	// authorize the request for the current user
	async authorize () {
console.warn('PUT USER: ' + JSON.stringify(this.request.body, 0, 10));
		// only the user themself can update themself
		const userId = this.request.params.id.toLowerCase();
		if (userId !== 'me' && userId !== this.user.id) {
			throw this.errorHandler.error('updateAuth', { reason: 'only the user can update their own attributes' });
		}
		if (this.request.params.id === 'me') {
			// use current user's ID if me specified
			this.request.params.id = this.user.id;
		}
	}

	// after the user is updated...
	async postProcess () {
		await this.publishUser();
	}

	// publish the user to the appropriate broadcaster channel(s)
	async publishUser () {
		await new UserPublisher({
			user: this.user,
			data: this.responseData.user,
			request: this,
			broadcaster: this.api.services.broadcaster
		}).publishUserToTeams();
	}

	// describe this route for help
	static describe (module) {
		const description = PutRequest.describe(module);
		description.access = 'The current user can only update their own user object',
		description.input = {
			summary: description.input + '; the ID in the path can also be \'me\'',
			looksLike: {
				'username': '<Updated username for the user, must be unique for any teams the user is on>',
				'fullName': '<User\'s full name>',
				'timeZone': '<User\'s time zone (eg. America/New_York)>',
				'phoneNumber': '<User\'s phone number>',
				'iWorkOn': '<What ths user works on>',
				'status': '<User\'s status object, defined by client>',
				'avatar': '<User\'s headshot or avatar object, as defined by client>',
				'modifiedRepos': '<Object describing what the user is current working on by repo, object defined by client>'
			}
		};
		description.publishes = {
			summary: 'Publishes the update on the team channel for all teams the user is on',
			looksLike: {
				user: '<@@#user object#stream@@>',
			}
		};
		description.errors.push('usernameNotUnique');
		return description;
	}
}

module.exports = PutUserRequest;
