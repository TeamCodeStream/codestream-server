'use strict';

const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const Assert = require('assert');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const UUID = require('uuid').v4;

class PutPresenceTest extends CodeStreamAPITest {

	constructor (options) {
		super(options);
		this.userOptions.numRegistered = 1;
		delete this.teamOptions.creatorIndex;
	}

	get description () {
		return 'should set session data for the session when presence is updated';
	}

	get method () {
		// when dontFetchToVerify is specified, we're not fetching session data to verify
		// the presence data was correctly written; in this case the test itself
		// is just writing the presence data
		return this.dontFetchToVerify ? 'put' : 'get';
	}

	get path () {
		// when dontFetchToVerify is specified, we're not fetching session data to verify
		// the presence data was correctly written; in this case the test itself
		// is just writing the presence data
		return this.dontFetchToVerify ? '/presence' : '/sessions';
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.setPresenceData,	// set the data to use when setting presence data
			this.setPresence		// save presence data to the server
		], callback);
	}

	// set the data to use when setting presence data
	setPresenceData (callback) {
		this.presenceData = {
			sessionId: UUID(),
			status: 'online'
		};
		callback();
	}

	// save presence data to the server
	setPresence (callback) {
		if (this.dontFetchToVerify) {
			// the test will be setting the data itself, not fetching the sessions
			// data afterwards, so don't do anything here
			this.data = this.presenceData;
			return callback();
		}
		this.updatedAfter = Date.now();
		this.doApiRequest(
			{
				method: 'put',
				path: '/presence',
				data: this.presenceData,
				token: this.token
			},
			callback
		);
	}

	// validate the response to the test request
	validateResponse (data) {
		// validate the session data was updated appropriately
		const session = data.sessions[this.presenceData.sessionId];
		Assert(session.status === this.presenceData.status, 'status does not match');
		Assert(session.updatedAt >= this.updatedAfter, 'updatedAt timestamp not properly set');
	}
}

module.exports = PutPresenceTest;
