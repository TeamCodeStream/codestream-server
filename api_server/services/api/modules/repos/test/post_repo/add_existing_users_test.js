'use strict';

var Add_Users_Test = require('./add_users_test');

class Add_Existing_Users_Test extends Add_Users_Test {

	get_description () {
		return 'should return the repo and existing users when creating a repo with emails representing existing registered users';
	}

	create_other_users (callback) {
		this.user_factory.create_random_users(
			3,
			(error, response) => {
				if (error) { return callback(error); }
				this.other_user_data = response;
				let emails = this.other_user_data.map(user_data => { return user_data.user.emails[0]; });
				this.team_emails = [...emails, this.current_user.emails[0]];
				this.repo_options = {
					with_emails: emails
				};
				callback();
			},
			this.create_user_options || {}
		);
	}
}

module.exports = Add_Existing_Users_Test;
