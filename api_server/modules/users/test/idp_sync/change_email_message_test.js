'use strict';

const ChangeNameMessageTest = require('./change_name_message_test');

class ChangeEmailMessageTest extends ChangeNameMessageTest {

	get description () {
		return 'members of the team should receive a message with the changes to a user a when an email change is discovered through IDP';
	}

	// set mock data to use during the test
	makeMockData (callback) {
		super.makeMockData(error => {
			if (error) { return callback(error); }
			delete this.data.name;
			this.data.email = this.userFactory.randomEmail();
			delete this.message.user.$set.fullName;
			this.message.user.$set.email = this.data.email;
			this.mockHeaders['X-CS-NR-Mock-User'] = JSON.stringify(this.data);
			callback();
		});
	}
}

module.exports = ChangeEmailMessageTest;
