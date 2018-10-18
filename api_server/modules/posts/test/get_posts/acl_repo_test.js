'use strict';

const GetPostsTest = require('./get_posts_test');

class ACLRepoTest extends GetPostsTest {

	constructor (options) {
		options = Object.assign(options || {}, { type: 'file' });
		super(options);
		this.teamOptions.members = [];
	}

	get description () {
		return 'should return an error when trying to fetch posts for a file in a team i\'m not a member of';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1009'
		};
	}

	// set the path to use for the request
	setPath (callback) {
		const streamPath = encodeURIComponent(this.stream.file);
		this.path = `/posts/?teamId=${this.team._id}&repoId=${this.repo._id}&path=${streamPath}`;
		callback();
	}
}

module.exports = ACLRepoTest;
