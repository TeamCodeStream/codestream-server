// utility functions for the email module

'use strict';

module.exports = {

	// given a user, figure out a display name to use in the subject
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
