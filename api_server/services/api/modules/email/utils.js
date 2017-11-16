'use strict';

module.exports = {

	getUserName: function(user) {
		if (user.firstName && user.lastName) {
			return user.firstName + ' ' + user.lastName;
		}
		else if (user.firstName) {
			return user.firstName;
		}
		else {
			return user.email;
		}
	}
};
