'use strict';

const SubscriptionToObjectByMentionTest = require('./subscription_to_object_by_mention_test');

class SubscriptionToObjectByMentionOtherTeamTest extends SubscriptionToObjectByMentionTest {

	constructor (options) {
		super(options);
		this.teamOptions.members = [];
	}

	get description () {
		return `user should be able to subscribe to an object channel after raw login when they have been mentioned in an object stream, even if they are on a different team from the creator of the object`;
	}
}

module.exports = SubscriptionToObjectByMentionOtherTeamTest;
