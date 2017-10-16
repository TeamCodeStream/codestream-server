'use strict';

var Direct_On_The_Fly_Test = require('./direct_on_the_fly_test');
var Assert = require('assert');

class Channel_On_The_Fly_Test extends Direct_On_The_Fly_Test {

	constructor (options) {
		super(options);
		this.stream_type = 'channel';
	}

	get description () {
		return 'should return a valid post and stream when creating a post and creating a channel stream on the fly';
	}

	validate_stream (data) {
		let stream = data.stream;
		Assert(stream.name === this.data.stream.name, 'name does not match');
		super.validate_stream(data);
	}
}

module.exports = Channel_On_The_Fly_Test;
