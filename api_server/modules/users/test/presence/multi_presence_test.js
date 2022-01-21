'use strict';

const PresenceTest = require('./presence_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const UUID = require('uuid').v4;

class MultiPresenceTest extends PresenceTest {

	constructor (options) {
		super(options);
		this.teamOptions.preCreateTeam = this.setOtherPresenceData;
	}

	get description () {
		return 'should set session data for the session when presence is updated, even if other presence information has already been set';
	}

	// set other presence data to precede the presence data for the test
	setOtherPresenceData (teamCreator, callback) {
		this.teamCreator = teamCreator;
		BoundAsync.times(
			this,
			3,
			this.setSinglePresenceData,
			callback
		);
	}

	// set some presence data for a single session
	setSinglePresenceData (n, callback) {
		const data = {
			sessionId: UUID(),
			status: 'away'
		};
		this.doApiRequest(
			{
				method: 'put',
				path: '/presence',
				data: data,
				token: this.teamCreator.token
			},
			callback
		);
	}
}

module.exports = MultiPresenceTest;
