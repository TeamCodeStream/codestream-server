'use strict';

const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');

class ConflictingUsernameTest extends CodeStreamAPITest {

	constructor (options) {
		super(options);
		Object.assign(this.teamOptions, {
			creatorIndex: 1,
			numAdditionalInvites: 2
		});
	}

	get description () {
		return 'should return an error when attempting to confirm a user with a username that is already taken on the team';
	}

	get method () {
		return 'post';
	}

	get path () {
		return '/no-auth/confirm';
	}

	getExpectedError () {
		return {
			code: 'TEAM-1000',
		};
	}

	// before the test runs...
	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			// register a user, we'll try to confirm with the same username as the registered user we created
			this.registerUser(callback); 
		});
	}

	// register one of the unregistered users we created, without confirming,
	// but we'll give this user the same username as the registered user when we confirm
	registerUser (callback) {
		const email = this.users[3].user.email;
		this.doApiRequest(
			{
				method: 'post',
				path: '/no-auth/register',
				data: {
					email,
					username: 'someuser',
					password: 'blahblahblah',
					_confirmationCheat: this.apiConfig.secrets.confirmationCheat,	// gives us the confirmation code in the response
					_forceConfirmation: true // overrides developer environment, where confirmation might be turned off
				}
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.data = {
					email,
					username: this.users[1].user.username,	// same username as a previously registered user, which triggers the conflict
					password: 'blahblahblah',	// required, whatever
					confirmationCode: response.user.confirmationCode
				};
				callback();
			}
		);
	}
}

module.exports = ConflictingUsernameTest;
