'use strict';

var Bound_Async = require(process.env.CI_API_TOP + '/lib/util/bound_async');
var Add_Mixed_Users_Test = require('./add_mixed_users_test');

class Add_Users_Unique_Usernames_Test extends Add_Mixed_Users_Test {

	get_description () {
		return 'should return an error when creating a repo with emails where there is a uername conflict with an existing email';
	}

	get_expected_fields () {
		return null;
	}

	get_expected_error () {
		return {
			code: 'TEAM-1000'
		};
	}

	before (callback) {
		Bound_Async.series(this, [
			this.create_conflicting_user,
			super.before
		], callback);
	}

	create_conflicting_user (callback) {
		this.user_factory.create_random_user(
			(error, response) => {
				if (error) { return callback(error); }
				this.team_emails = [response.user.emails[0]];
				callback();
			},
			{ with: { username: this.current_user.username } }
		);

	}
}

module.exports = Add_Users_Unique_Usernames_Test;
