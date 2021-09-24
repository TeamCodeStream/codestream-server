// provide a factory for creating random New Relic comments, for testing purposes

'use strict';

var RandomString = require('randomstring');

class RandomNRCommentFactory {

	constructor (options) {
		Object.assign(this, options);
	}

	randomUser (options = {}) {
		const user = {
			email: this.userFactory.randomEmail(options),
			fullName: this.userFactory.randomFullName()
		};
		if (options.includeNewRelicUserId) {
			user.newRelicUserId = this.randomNewRelicUserId();
		}
		return user;
	}

	randomNewRelicUserId () {
		return RandomString.generate(20);
	}
	
	// get some random NR comment data
	getRandomNRCommentData (options = {}) {
		const data = {
			creator: this.randomUser(options),
			accountId: this.codeErrorFactory.randomAccountId(),
			objectId: this.codeErrorFactory.randomObjectId(),
			objectType: options.objectType || 'errorGroup',
			text: RandomString.generate(1000)
		};
		if (options.mentionedUsers) {
			data.mentionedUsers = '_'.repeat(options.mentionedUsers - 1).split('_').map(_ => {
				return this.randomUser(options);
			});
		}
		return data;
	}
}

module.exports = RandomNRCommentFactory;
