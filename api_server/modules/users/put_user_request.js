// handle the PUT /users request to edit attributes of a user

'use strict';

var PutRequest = require(process.env.CS_API_TOP + '/lib/util/restful/put_request');
var UserPublisher = require('./user_publisher');

class PutUserRequest extends PutRequest {

	// authorize the request for the current user
	authorize (callback) {
		// only the user themself can update themself
		let userId = this.request.params.id.toLowerCase();
		if (userId !== 'me' && userId !== this.user.id) {
            return callback(this.errorHandler.error('updateAuth', { reason: 'only the user can update their own attributes' }));
		}
		if (this.request.params.id === 'me') {
			// use current user's ID if me specified
			this.request.params.id = this.user.id;
		}
		return callback();
	}

	// after the user is updated...
	postProcess (callback) {
        this.publishUser(callback);
	}

	// publish the user to the appropriate messager channel(s)
	publishUser (callback) {
		new UserPublisher({
			user: this.user,
			data: this.responseData.user,
			request: this,
			messager: this.api.services.messager
		}).publishUserToTeams(callback);
	}
}

module.exports = PutUserRequest;
