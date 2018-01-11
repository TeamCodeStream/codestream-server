'use strict';

var GetStreamsTest = require('./get_streams_test');
var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class CorrectSortOrderTest extends GetStreamsTest {

	constructor (options) {
		super(options);
		this.numStreams = 10;
		this.dontDoForeign = true;
		this.dontDoTeamStreams = true;
		this.waitTime = 1200; // this test requires a wait time to make sure IDs are assigned in sequential order
	}

	get description () {
		return 'should return the correct streams in correct order when requesting streams in ascending order by sort ID, when some of the streams have recent posts';
	}

	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.wait,
			this.createPosts,
			this.setPath
		], callback);
	}

	wait (callback) {
		setTimeout(callback, this.waitTime);
	}

	createPosts (callback) {
		this.myStreams = this.streamsByRepo[this.myRepo._id];
		this.myStreams.sort((a, b) => {
			return a._id.localeCompare(b._id);
		});
		let streamsWithPost = [];
		[4, 2, 7, 3].forEach(index => {
			let stream = this.myStreams[index];
			this.myStreams.splice(index, 1);
			streamsWithPost.push(stream);
			this.myStreams.push(stream);
		});
		this.myStreams.reverse();
		BoundAsync.forEachSeries(
			this,
			streamsWithPost,
			this.createPostForStream,
			callback
		);
	}

	createPostForStream (stream, callback) {
		this.postFactory.createRandomPost(
			(error, response) => {
				if (error) { return callback(error); }
				stream.mostRecentPostId = stream.sortId = response.post._id;
				setTimeout(() => { callback(); }, this.waitTime);
			},
			{
				teamId: this.myTeam._id,
				streamId: stream._id,
				token: this.otherUserData.accessToken
			}
		);
	}

	setPath (callback) {
		this.path = `/streams/?teamId=${this.myTeam._id}&repoId=${this.myRepo._id}`;
		callback();
	}

	validateResponse (data) {
		this.validateSortedMatchingObjects(data.streams, this.myStreams, 'streams');
		super.validateResponse(data);
	}
}

module.exports = CorrectSortOrderTest;
