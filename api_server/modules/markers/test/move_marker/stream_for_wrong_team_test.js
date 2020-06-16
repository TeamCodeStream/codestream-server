'use strict';

const MoveTest = require('./move_test');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const RandomString = require('randomstring');

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
			this.createOtherTeam,
			this.createOtherRepo,
			this.createOtherStream
		], callback);
	}

	createOtherTeam (callback) {
		this.teamFactory.createRandomTeam(
			(error, response) => {
				if (error) { return callback(error); }
				this.otherTeam = response.team;
				this.otherTeamStream = response.streams[0];
				callback();
			},
			{ token: this.token }
		);
	}

	createOtherRepo (callback) {
		this.doApiRequest(
			{
				method: 'post',
				path: '/posts',
				data: {
					streamId: this.otherTeamStream.id,
					codemark: {
						type: 'comment',
						text: 'x',
						markers: [{
							file: this.streamFactory.randomFile(),
							remotes: [this.repoFactory.randomUrl()],
							commitHash: this.markerFactory.randomCommitHash(),
							code: RandomString.generate(100)
						}]
					}
				},
				token: this.token
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.otherRepo = response.repos[0];
				callback();
			}
		);
	}

	createOtherStream (callback) {
		this.streamFactory.createRandomStream(
			(error, response) => {
				if (error) return callback(error);
				delete this.data.file;
				this.data.fileStreamId = response.stream.id;
				callback();
			},
			{
				teamId: this.otherTeam.id,
				repoId: this.otherRepo.id,
				type: 'file',
				token: this.token
			}
		);
	}
}

module.exports = StreamForWrongTeamTest;
