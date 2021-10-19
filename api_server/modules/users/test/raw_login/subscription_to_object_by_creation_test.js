'use strict';

const SubscriptionTest = require('./subscription_test');

class SubscriptionToObjectByCreationTest extends SubscriptionTest {

	constructor (options) {
		super(options);
		Object.assign(this.postOptions, {
			creatorIndex: 0,
			wantCodeError: true
		});
	}

	get description () {
		return `user should be able to subscribe to an object channel after raw login when they have created the object`;
	}

	login (callback) {
		this.object = this.postData[0].codeError;
		this.which = 'object';
		super.login(callback);
	}
}

module.exports = SubscriptionToObjectByCreationTest;
