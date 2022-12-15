'use strict';

const JoinOnConfirmTest = require('./join_on_confirm_test');

class JoinOnConfirmDifferentEmailTest extends JoinOnConfirmTest {

	get description () {
		return 'when a registered user signs up and confirms, if a company to join is specified, the user automatically joins that company, even if they specify a different email on registration';
	}

	getUserData () {
		const data = super.getUserData();
		data.email = this.userFactory.randomEmail();
		return data;
	}
}

module.exports = JoinOnConfirmDifferentEmailTest;
