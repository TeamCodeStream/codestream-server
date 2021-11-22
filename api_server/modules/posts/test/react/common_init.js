// base class for many tests of the "PUT /react/:id" requests

'use strict';

const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const RandomString = require('randomstring');
const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');

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
		this.postOptions.creatorIndex = 1;
		callback();
	}

	// form the data for the reaction
	makePostData (callback) {
		const whichPost = this.whichPost || 0;
		this.post = this.postData[whichPost].post;
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
		this.updatedAt = Date.now();
		callback();
	}
}

module.exports = CommonInit;
