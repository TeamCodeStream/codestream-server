// base class for many tests of the "PUT /react/:id" requests

'use strict';

const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const RandomString = require('randomstring');
const CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');

class CommonInit {

	init (callback) {
		this.expectedVersion = 2;
		BoundAsync.series(this, [
			this.setTestOptions,
			CodeStreamAPITest.prototype.before.bind(this),
			this.makePostData		// make the data to be used during the update
		], callback);
	}

	setTestOptions (callback) {
		this.userOptions.numRegistered = 3;
		this.streamOptions.creatorIndex = 1;
		this.streamOptions.type = this.streamType || 'channel';
		this.postOptions.creatorIndex = 0;
		callback();
	}

	// form the data for the reaction
	makePostData (callback) {
		this.post = this.postData[0].post;
		this.reaction = RandomString.generate(8);
		this.data = {
			[this.reaction]: true
		};
		this.expectedData = {
			post: {
				_id: this.post.id,	// DEPRECATE ME
				id: this.post.id,
				$addToSet: {
					[`reactions.${this.reaction}`]: this.currentUser.user.id
				},
				$set: {
					version: this.expectedVersion
				},
				$version: {
					before: this.expectedVersion - 1,
					after: this.expectedVersion
				}
			}
		};
		this.path = '/react/' + this.post.id;
		callback();
	}
}

module.exports = CommonInit;
