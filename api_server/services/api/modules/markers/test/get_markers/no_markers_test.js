'use strict';

var CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');

class NoMarkersTest extends CodeStreamAPITest {

	get description () {
		return 'should return a flag indicating the stream has no markers when requesting markers for a stream that has no markers';
	}

	getExpectedFields () {
		return {
			streamHasNoMarkers: true
		};
	}

	before (callback) {
		BoundAsync.series(this, [
			this.createRepo,
			this.createStream
		], callback);
	}

	createRepo (callback) {
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				this.repo = response.repo;
				callback();
			},
			{
				token: this.token
			}
		);
	}

	createStream (callback) {
		let commitHash = this.postFactory.randomCommitHash();
		this.streamFactory.createRandomStream(
			(error, response) => {
				if (error) { return callback(error); }
				this.path = `/markers?teamId=${this.repo.teamId}&streamId=${response.stream._id}&commitHash=${commitHash}`;
				callback();
			},
			{
				type: 'file',
				token: this.token,
				teamId: this.repo.teamId,
				repoId: this.repo._id
			}
		);
	}
}

module.exports = NoMarkersTest;
