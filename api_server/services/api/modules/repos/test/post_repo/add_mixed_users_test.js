'use strict';

var Bound_Async = require(process.env.CI_API_TOP + '/lib/util/bound_async');
var Add_Users_Test = require('./add_users_test');

class Add_Mixed_Users_Test extends Add_Users_Test {

	get_description () {
		return 'should return the repo and all users when creating a repo with emails representing new and existing registered and unregistered users';
	}

	before (callback) {
		this.team_emails = this.team_emails || [];
		this.team_emails.push(this.current_user.emails[0]);
		Bound_Async.series(this, [
			this.create_unregistered_users,
			this.create_registered_users,
			super.before
		], callback);
	}

	create_unregistered_users (callback) {
		this.user_factory.create_random_users(
			2,
			(error, response) => {
				if (error) { return callback(error); }
				let emails = response.map(user_data => { return user_data.user.emails[0]; });
				this.team_emails = [...this.team_emails, ...emails];
				callback();
			},
			{ no_confirm: true }
		);
	}

	create_registered_users (callback) {
		this.user_factory.create_random_users(
			2,
			(error, response) => {
				if (error) { return callback(error); }
				let emails = response.map(user_data => { return user_data.user.emails[0]; });
				this.team_emails = [...this.team_emails, ...emails];
				callback();
			}
		);
	}
}

module.exports = Add_Mixed_Users_Test;
