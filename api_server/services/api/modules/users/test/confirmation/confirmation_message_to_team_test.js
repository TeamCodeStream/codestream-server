'use strict';

var CodeStream_Message_Test = require(process.env.CS_API_TOP + '/services/api/modules/messager/test/codestream_message_test');
var Bound_Async = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var Random_String = require('randomstring');
const Secrets_Config = require(process.env.CS_API_TOP + '/config/secrets.js');

class Confirmation_Message_To_Team_Test extends CodeStream_Message_Test {

	get description () {
		return 'the team creator should receive a message indicating a user is registered when a user on the team confirms registration';
	}

	make_data (callback) {
		this.repo_factory.create_random_repo(
			(error, response) => {
				if (error) { return callback(error); }
				this.repo = response.repo;
				this.team = response.team;
				this.users = response.users;
				callback();
			},
			{
				with_random_emails: 2,
				token: this.token
			}
		);
	}

	set_channel_name (callback) {
		this.channel_name = 'team-' + this.team._id;
		callback();
	}

	generate_message (callback) {
		Bound_Async.series(this, [
			this.register_user,
			this.confirm_user
		], callback);
	}

	register_user (callback) {
		this.registering_user = this.users[1];
		Object.assign(this.registering_user, {
			username: Random_String.generate(12),
			password: Random_String.generate(12),
			_confirmation_cheat: Secrets_Config.confirmation_cheat,	// gives us the confirmation code in the response
			_force_confirmation: true								// this forces confirmation even if not enforced in environment
		});
		this.user_factory.register_user(
			this.registering_user,
			(error, response) => {
				if (error) { return callback(error); }
				this.registering_user = response.user;
				callback();
			}
		);
	}

	confirm_user (callback) {
		this.message = {
			users: [{
				_id: this.registering_user._id,
				is_registered: true
			}]
		};

		// confirming one of the random users created should trigger the message
		this.user_factory.confirm_user(this.registering_user, callback);
	}
}

module.exports = Confirmation_Message_To_Team_Test;
