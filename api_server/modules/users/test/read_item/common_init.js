// base class for many tests of the "PUT /read-item/:id" requests

'use strict';

const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const RandomString = require('randomstring');

class CommonInit {

	init (callback) {
		BoundAsync.series(this, [
			CodeStreamAPITest.prototype.before.bind(this),
			this.setExpectedData
		], callback);
	}

	setExpectedData (callback) {
		this.itemId = RandomString.generate(10);
		this.numReplies = 3;
		this.data = { numReplies: this.numReplies };
		this.expectedData = {
			user: {
				_id: this.currentUser.user.id,	// DEPRECATE ME
				id: this.currentUser.user.id,
				$set: {
					[`lastReadItems.${this.itemId.toLowerCase()}`]: this.numReplies,
					version: 6
				},
				$version: {
					before: 5,
					after: 6
				}
			}
		};
		callback();
	}

	setItemRead (callback) {
		this.doApiRequest(
			{
				method: 'put',
				path: '/read-item/' + this.itemId,
				data: this.data,
				token: this.token
			},
			callback
		);
	}
}

module.exports = CommonInit;
