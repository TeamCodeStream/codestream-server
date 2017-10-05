'use strict';

module.exports = {

	get_user_name: function(user) {
		if (user.first_name && user.last_name) {
			return user.first_name + ' ' + user.last_name;
		}
		else if (user.first_name) {
			return user.first_name;
		}
		else {
			return user.email;
		}
	}
};
