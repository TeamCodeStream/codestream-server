'use strict';

var GetStreamsTest = require('./get_streams_test');
var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class CorrectSortOrderTest extends GetStreamsTest {

	constructor (options) {
		super(options);
		this.numStreams = 10;	// create this many streams before the test runs
		this.dontDoForeign = true;	// don't need a team and streams we aren't a member of for this test
		this.dontDoTeamStreams = true;	// don't need any channel or direct streams for this test
		this.waitTime = 1200; // this test requires a wait time to make sure IDs are assigned in sequential order
	}

	get description () {
		return 'should return the correct streams in correct order when requesting streams in ascending order by sort ID, when some of the streams have recent posts';
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,	// run the standard test prep
			this.wait,		// wait a bit, since the stream sort order may be set after the response to the initial request is returned
			this.createPosts,	// create some posts in some of the streams, this influences their sort order
			this.setPath		// set the path to use when issuing the test request
		], callback);
	}

	// wait some time to make sure IDs are assigned in sequential order
	wait (callback) {
		setTimeout(callback, this.waitTime);
	}

	// create some posts in some of the streams to rearrange their sort order, since streams are fetched by 
	// most recent post first
	createPosts (callback) {
		this.myStreams = this.streamsByRepo[this.myRepo._id];
		this.myStreams.sort((a, b) => {	// sort by ID, which is the default sort order when there are no posts 
			return a._id.localeCompare(b._id);
		});
		let streamsWithPost = [];
		// for these streams, and in this order, we'll create a post, which changes its sort order
		// we expect to get the streams back in the appropriate order
		[4, 2, 7, 3].forEach(index => {
			let stream = this.myStreams[index];
			// push this stream to the back of the line, this should now be first (after we reverse the sort order)
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

	// create a post in the given stream
	createPostForStream (stream, callback) {
		this.postFactory.createRandomPost(
			(error, response) => {
				if (error) { return callback(error); }
				// we expect the mostRecentPostId field to be updated by this
				stream.mostRecentPostId = stream.sortId = response.post._id;	
				stream.mostRecentPostCreatedAt = response.post.createdAt;
				setTimeout(() => { callback(); }, this.waitTime);	// wait for the update to take, since we get the response before it persists
			},
			{
				teamId: this.myTeam._id,
				streamId: stream._id,
				token: this.otherUserData.accessToken	// let the "other" user create the post
			}
		);
	}

	// set the path to use when issuing the request
	setPath (callback) {
		this.path = `/streams/?teamId=${this.myTeam._id}&repoId=${this.myRepo._id}`;
		callback();
	}

	// validate the response to the test request
	validateResponse (data) {
		// validate that we got the streams back in the correct order, before standard validation
		this.validateSortedMatchingObjects(data.streams, this.myStreams, 'streams');
		super.validateResponse(data);
	}
}

module.exports = CorrectSortOrderTest;
