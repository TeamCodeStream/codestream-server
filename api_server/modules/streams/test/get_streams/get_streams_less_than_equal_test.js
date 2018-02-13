'use strict';

var GetStreamsTest = require('./get_streams_test');
var ObjectID = require('mongodb').ObjectID;

class GetStreamsLessThanEqualTest extends GetStreamsTest {

	constructor (options) {
		super(options);
		this.dontDoForeign = true;
		this.dontDoTeamStreams = true;
	}

	get description () {
		return 'should return the correct streams when requesting streams with sort IDs less than or equal to some value';
	}

	// set the path to use when issuing the test request
	setPath (callback) {
		// pick the ID of a stream in the middle of the streams we created, and expect all those with IDs less than or equal
		this.myStreams = this.streamsByRepo[this.myRepo._id];
		let pivot = this.myStreams[2]._id;
		this.myStreams = this.myStreams.filter(stream => ObjectID(stream.sortId) <= ObjectID(pivot));
		this.path = `/streams/?teamId=${this.myTeam._id}&repoId=${this.myRepo._id}&lte=${pivot}`;
		callback();
	}
}

module.exports = GetStreamsLessThanEqualTest;
