'use strict';

var GetPostsTest = require('./get_posts_test');

class ACLRepoTest extends GetPostsTest {

	constructor (options) {
		super(options);
		this.withoutMeOnTeam = true;	// without me on the team, i won't be able to fetch the post, no matter what type the stream is
		this.type = 'file';
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
		let streamPath = encodeURIComponent(this.stream.file);
		this.path = `/posts/?teamId=${this.team._id}&repoId=${this.repo._id}&path=${streamPath}`;
		callback();
	}
}

module.exports = ACLRepoTest;
