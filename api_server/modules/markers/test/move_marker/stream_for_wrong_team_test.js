'use strict';

const MoveTest = require('./move_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const TestTeamCreator = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/test_team_creator');

class StreamForWrongTeamTest extends MoveTest {

	get description () {
		return 'should return an error when attempting to move the location for a marker that points to a file stream from a different team';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1011',
			reason: 'marker stream must be from the same team'
		};
	}

	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.createForeignStream
		], callback);
	}

	createForeignStream (callback) {
		new TestTeamCreator({
			test: this,
			teamOptions: Object.assign({}, this.teamOptions, {
				creatorIndex: null,
				creatorToken: this.users[1].accessToken,
				members: [this.currentUser.user.email],
				numAdditionalInvites: 0
			}),
			userOptions: this.userOptions,
			repoOptions: { 
				creatorToken: this.users[1].accessToken
			}
		}).create((error, response) => {
			if (error) { return callback(error); }
			const foreignStream = response.repoStreams.find(stream => stream.type === 'file');
			this.data.fileStreamId = foreignStream.id;
			callback();
		});
	}
}

module.exports = StreamForWrongTeamTest;
