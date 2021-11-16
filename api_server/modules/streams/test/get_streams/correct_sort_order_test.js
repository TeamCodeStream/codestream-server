'use strict';

const GetStreamsTest = require('./get_streams_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const Assert = require('assert');

class CorrectSortOrderTest extends GetStreamsTest {

	get description () {
		return 'should return the correct streams in correct order when requesting streams in ascending order by sort ID, when some of the streams have recent posts';
	}

	setTestOptions (callback) {
		this.dontDoForeign = true;	// don't need a team and streams we aren't a member of for this test
		//this.dontDoDirectStreams = true;	// don't need any direct streams for this test
		this.dontDoFileStreams = true;		// don't need any file streams for this test
		this.waitTime = 1200; // this test requires a wait time to make sure IDs are assigned in sequential order
		super.setTestOptions(callback);
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
		// since we can now only create posts in the team stream, this test really just
		// becomes about making sure the team stream is first if we post in it
		this.expectedStreams = this.getExpectedStreams();
		this.expectedStreams.sort((a, b) => {	// sort by ID, which is the default sort order when there are no posts 
			return a.sortId.localeCompare(b.sortId);
		});
		this.updatedAt = Date.now();

		const streamsWithPost = [];
		// for these streams, and in this order, we'll create a post, which changes its sort order
		// we expect to get the streams back in the appropriate order
		[4, 2, 7, 11, 3].forEach(index => {
			const stream = this.expectedStreams[index];
			// push this stream to the back of the line, this should now be first (after we reverse the sort order)
			this.expectedStreams.splice(index, 1);
			streamsWithPost.push(stream);
			this.expectedStreams.push(stream);
		});
		this.expectedStreams.reverse();
		this.updatedAt = Date.now();
		BoundAsync.forEachSeries(
			this,
			streamsWithPost,
			this.createPostForStream,
			callback
		);
	}

	// create a post in the given stream
	createPostForStream (stream, callback) {
		let parentPostId;
		if (stream.type === 'object') {
			parentPostId = stream.post.id;
		}
		this.postFactory.createRandomPost(
			(error, response) => {
				if (error) { return callback(error); }
				// we expect the mostRecentPostId field to be updated by this
				stream.mostRecentPostId = stream.sortId = response.post.id;	
				stream.mostRecentPostCreatedAt = response.post.createdAt;
				setTimeout(() => { callback(); }, this.waitTime);	// wait for the update to take, since we get the response before it persists
			},
			{
				teamId: this.team.id,
				streamId: stream.id,
				parentPostId,
				token: this.users[1].accessToken	// let the "other" user create the post
			}
		);
	}

	// set the path to use when issuing the request
	setPath (callback) {
		this.path = `/streams?teamId=${this.team.id}`;
		callback();
	}

	// validate the response to the test request
	validateResponse (data) {
		for (let i = 0; i < data.streams.length; i++) {
			const stream = data.streams[i];
			const expectedStream = this.expectedStreams[i];
			if (stream.version > 1) {
				Assert(stream.modifiedAt >= this.updatedAt, 'modifiedAt not changed for stream with post');
				expectedStream.modifiedAt = stream.modifiedAt;
				expectedStream.version = stream.version;
			}
		}
		// validate that we got the streams back in the correct order, before standard validation
		this.expectedStreams.forEach(stream => { delete stream.post });
		this.validateSortedMatchingObjects(data.streams, this.expectedStreams, 'streams');
		super.validateResponse(data);
	}
}

module.exports = CorrectSortOrderTest;
