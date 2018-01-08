// utility functions for the email module

'use strict';

module.exports = {

	// given a user, figure out a display name to use in the subject
	getUserName: function(user) {
		const firstName = user.get('firstName');
		const lastName = user.get('lastName');
		if (firstName && lastName) {
			return firstName + ' ' + lastName;
		}
		else if (firstName) {
			return firstName;
		}
		else {
			return user.get('email');
		}
	}
};
