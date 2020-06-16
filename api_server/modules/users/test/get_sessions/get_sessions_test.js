'use strict';

const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const Assert = require('assert');
const UUID = require('uuid/v4');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');

class GetSessionsTest extends CodeStreamAPITest {

	constructor (options) {
		super(options);
		this.userOptions.numRegistered = 1;
		delete this.teamOptions.creatorIndex;
	}

	get description () {
		return 'should return my sessions when requesting them';
	}

	get method () {
		return 'get';
	}

	get path () {
		return '/sessions';
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.sendPresenceUpdates
		], callback);
	}

	sendPresenceUpdates (callback) {
		// make the sessions data, and write it to the server,
		// we'll then read it back for the test
		this.makeSessionsData();
		BoundAsync.forEach(
			this,
			Object.keys(this.expectData),
			this.sendPresence,
			callback
		);
	}

	// send a presence status for a single sessionId to the server
	sendPresence (sessionId, callback) {
		const data = {
			sessionId,
			status: this.expectData[sessionId].status
		};
		this.doApiRequest(
			{
				method: 'put',
				path: '/presence',
				data: data,
				token: this.token
			},
			callback
		);
	}

	// make the sessions data for the test, which we'll write out to the
	// server and then read back
	makeSessionsData () {
		// invent some sessions with various statuses
		const sessionId1 = UUID();
		const sessionId2 = UUID();
		const sessionId3 = UUID();
		this.expectData = {
			[sessionId1]: {
				status: 'online'
			},
			[sessionId2]: {
				status: 'away'
			},
			[sessionId3]: {
				status: 'inactive'
			}
		};
		this.modifiedAfter = Date.now();
		return this.expectData;
	}

	// validate the response to the test request
	validateResponse (data) {
		const sessions = data.sessions;
		// since the server sets a timestamp, we'll validate those, and then add them
		// to the response data for quick validation of the whole
		Object.keys(this.expectData).forEach(sessionId => {
			Assert(sessions[sessionId].updatedAt > this.modifiedAfter, 'updatedAt timestamp not correct set');
			this.expectData[sessionId].updatedAt = sessions[sessionId].updatedAt;
		});
		// validate that we got back the data we wrote
		Assert.deepEqual(sessions, this.expectData, 'returned sessions data does not match');
	}
}

module.exports = GetSessionsTest;
