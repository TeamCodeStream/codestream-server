'use strict';

var GetPostTest = require('./get_post_test');

class ACLTest extends GetPostTest {

	constructor (options) {
		super(options);
		this.withoutMe = true;
	}

	get description () {
		return `should return an error when trying to fetch a post from a ${this.type} stream from a team that i\'m not a member of`;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1009'
		};
	}

	setPath (callback) {
		this.path = '/posts/' + this.post._id;
		callback();
	}
}

module.exports = ACLTest;
