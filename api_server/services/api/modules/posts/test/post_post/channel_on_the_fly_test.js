'use strict';

var DirectOnTheFlyTest = require('./direct_on_the_fly_test');
var Assert = require('assert');

class ChannelOnTheFlyTest extends DirectOnTheFlyTest {

	constructor (options) {
		super(options);
		this.streamType = 'channel';
	}

	get description () {
		return 'should return a valid post and stream when creating a post and creating a channel stream on the fly';
	}

	validateStream (data) {
		let stream = data.stream;
		Assert(stream.name === this.data.stream.name, 'name does not match');
		super.validateStream(data);
	}
}

module.exports = ChannelOnTheFlyTest;
