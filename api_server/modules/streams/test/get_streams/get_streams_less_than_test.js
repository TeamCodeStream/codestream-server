'use strict';

var GetStreamsTest = require('./get_streams_test');
var ObjectID = require('mongodb').ObjectID;

class GetStreamsLessThanTest extends GetStreamsTest {

	constructor (options) {
		super(options);
		this.dontDoForeign = true;
		this.dontDoDirectStreams = true;
		this.dontDoFileStreams = true;
		delete this.repoOptions.creatorIndex;
	}

	get description () {
		return 'should return the correct streams when requesting streams with sort IDs less than some value';
	}

	// set the path to use when issuing the test request
	setPath (callback) {
		// pick the ID of a stream in the middle of the streams we created, and expect all those with IDs less than
		this.expectedStreams = this.streamsByTeam[this.team._id].filter(stream => {
			return stream.memberIds.includes(this.currentUser.user._id);
		});
		this.expectedStreams.push(this.teamStream);
		const pivot = this.expectedStreams[2]._id;
		this.expectedStreams = this.expectedStreams.filter(stream => ObjectID(stream.sortId) < ObjectID(pivot));
		this.path = `/streams/?teamId=${this.team._id}&lt=${pivot}`;
		callback();
	}
}

module.exports = GetStreamsLessThanTest;
