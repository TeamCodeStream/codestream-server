'use strict';

var Add_Existing_Users_Test = require('./add_existing_users_test');

class Add_Existing_Unegistered_Users_Test extends Add_Existing_Users_Test {

	constructor (options) {
		super(options);
		this.create_user_options = { no_confirm: true };
	}
	
	get_description () {
		return 'should return the repo and existing users when creating a repo with emails representing existing unregistered users';
	}
}

module.exports = Add_Existing_Unegistered_Users_Test;
