// base class for many tests of the "DELETE /users:id" requests

'use strict';

const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const DeepClone = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/deep_clone');
const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');

class CommonInit {

	init (callback) {
		BoundAsync.series(this, [
			this.setTestOptions,
			CodeStreamAPITest.prototype.before.bind(this),
			this.setExpectedData,
			this.setPath
		], callback);
	}

	setTestOptions (callback) {
		this.testUser = 1;
		callback();
	}

	setExpectedData (callback) {
		this.user = this.users[this.testUser].user;
		this.expectedVersion = this.expectedVersion || (this.user.version + 1);
		this.expectedData = {
			user: {
				_id: this.user.id,	// DEPRECATE ME
				id: this.user.id,
				$set: { 
					version: this.expectedVersion,
					deactivated: true,
					modifiedAt: Date.now(),	// placeholder
					email: this.user.email  // placeholder
				},
				$version: {
					before: this.expectedVersion - 1,
					after: this.expectedVersion
				}
			}
		};
		this.expectedUser = DeepClone(this.user);
		Object.assign(this.expectedUser, this.expectedData.user.$set);
		Object.assign(this.expectedUser, {
			lastReads: {},
			preferences: {
				acceptedTOS: true
			}
		});
		this.modifiedAfter = Date.now();
		callback();
	}

	setPath (callback) {
		this.path = '/users/' + this.user.id;
		callback();
	}

	deleteUser (callback) {
		this.doApiRequest(
			{
				method: 'delete',
				path: '/users/' + this.user.id,
				data: null,
				token: this.token
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.message = {
					users: [response.user]
				};
				callback();
			}
		);
	}
}

module.exports = CommonInit;
