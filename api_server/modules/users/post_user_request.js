// handle the 'POST /users' request, to create (invite) a user (or fetch if user
// with same email already exists)

'use strict';

const PostRequest = require(process.env.CS_API_TOP + '/lib/util/restful/post_request');
const AddTeamMembers = require(process.env.CS_API_TOP + '/modules/teams/add_team_members');
const AddTeamPublisher = require('./add_team_publisher');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class PostUserRequest extends PostRequest {

	authorize (callback) {
		// must be on the team to invite a user to it!
		this.user.authorizeFromTeamId(this.request.body, this, callback, { error: 'createAuth' });
	}

	// process the request...
	process (callback) {
		// totally pre-empt the restful creation of a model out of the box ... instead
		// what we're doing here is adding them to a team, and that flow will actually
		// create the user as needed
		BoundAsync.series(this, [
			this.requireAndAllow,
			this.addToTeam
		], error => {
			if (error) { return callback(error); }
			if (this.adder.membersAdded && this.adder.membersAdded.length > 0) {
				this.createdUser = this.adder.membersAdded[0];
			}
			else if (this.adder.usersFound && this.adder.usersFound.length > 0) {
				this.createdUser = this.adder.usersFound[0];
			}
			else {
				// shouldn't really happen
				return callback(this.errorHandler.error('notFound', { info: 'user' }));
			}
			this.responseData = { user: this.createdUser.getSanitizedObject() };
			callback();
		});
	}

	// require certain parameters, and discard unknown parameters
	requireAndAllow (callback) {
		this.delayEmail = this.request.body._delayEmail; // delay sending the invite email, for testing
		delete this.request.body._delayEmail;
		this.requireAllowParameters(
			'body',
			{
				required: {
					string: ['teamId', 'email']
				},
				optional: {
					string: ['firstName', 'lastName']
				}
			},
			callback
		);
	}

	// add the passed user to the team indicated, this will create the user as needed
	addToTeam (callback) {
		const user = Object.assign({}, this.request.body);
		delete user.teamId;
		this.adder = new AddTeamMembers({
			request: this,
			addUsers: [user],
			teamId: this.request.body.teamId.toLowerCase(),
			subscriptionCheat: this.request.body._subscriptionCheat, // allows unregistered users to subscribe to me-channel, needed for mock email testing
			saveUserIfExists: true	// override provided attributes of the user as needed
		});
		this.adder.addTeamMembers(callback);
	}

	// after the response has been sent...
	postProcess (callback) {
		BoundAsync.parallel(this, [
			this.publishAddToTeam,
			this.sendInviteEmail
		], callback);
	}

	// publish to the team that the user has been added,
	// and publish to the user that they've been added to the team
	publishAddToTeam (callback) {
		new AddTeamPublisher({
			request: this,
			messager: this.api.services.messager,
			user: this.createdUser,
			team: this.adder.team,
			existingMembers: this.adder.existingMembers,
		}).publishAddedUser(callback);
	}

	// send an invite email to the added user
	sendInviteEmail (callback) {
		if (this.delayEmail) {
			callback();	// respond, but delay sending the email
		}
		setTimeout(() => {	// allow client to delay the email send, for testing purposes
			this.api.services.email.sendInviteEmail(
				{
					inviter: this.user,
					user: this.createdUser,
					request: this
				},
				this.delayEmail ? () => {} : callback
			);
		}, this.delayEmail || 0);

	}
}

module.exports = PostUserRequest;
