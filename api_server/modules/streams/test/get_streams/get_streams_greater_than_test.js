'use strict';

var GetStreamsTest = require('./get_streams_test');
var ObjectID = require('mongodb').ObjectID;

class GetStreamsGreaterThanTest extends GetStreamsTest {

	constructor (options) {
		super(options);
		this.dontDoForeign = true;
		this.dontDoTeamStreams = true;
	}

	get description () {
		return 'should return the correct streams when requesting streams with sort IDs greater than some value';
	}

	setPath (callback) {
		this.myStreams = this.streamsByRepo[this.myRepo._id];
		let pivot = this.myStreams[2]._id;
		this.myStreams = this.myStreams.filter(stream => ObjectID(stream.sortId) > ObjectID(pivot));
		this.path = `/streams/?teamId=${this.myTeam._id}&repoId=${this.myRepo._id}&gt=${pivot}`;
		callback();
	}
}

module.exports = GetStreamsGreaterThanTest;
