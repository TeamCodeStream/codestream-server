// base class for many tests of the "POST /entities" requests

'use strict';

const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');

class CommonInit {

	init (callback) {
		BoundAsync.series(this, [
			this.setTestOptions,
			CodeStreamAPITest.prototype.before.bind(this),
			this.setPath,
			this.makeEntityData		// make the data to be used during the request
		], callback);
	}

	setTestOptions (callback) {
		this.entityOptions = {};
		this.teamOptions.creatorIndex = 1;
		callback();
	}

	// form the data for the generating the entity
	makeEntityData (callback) {
		this.data = this.entityFactory.getRandomEntityData(this.entityOptions);
		this.data.teamId = this.team.id;
		this.createdAfter = Date.now();
		callback();
	}

	// set the path to use during the test request
	setPath (callback) {
		this.path = '/entities';
		callback();
	}

	// create the entity for real
	createEntity (callback) {
		const token = this.useToken || (this.otherUserCreatesEntity ? this.users[1].accessToken : this.currentUser.accessToken);
		this.doApiRequest(
			{
				method: 'post',
				path: `/entities`,
				data: this.data,
				token
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.entityResponse = response;
				delete this.data;	// don't need this anymore
				callback();
			}
		);
	}
}

module.exports = CommonInit;
