'use strict';

const ComplexTest = require('./complex_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const Assert = require('assert');

class ComplexPaginationTest extends ComplexTest {

	get description () {
		let order = this.ascending ? 'ascending' : 'descending';
		let type = this.defaultPagination ? 'default' : 'custom';
		let description = `should return the correct posts, when a complex arrangement of posts is available, in correct ${order} order when requesting posts in ${type} pages`;
		if (this.tryOverLimit) {
			description += ', and should limit page size to the maximum allowed posts per page';
		}
		return description;
	}

	// override readConfig because immediately after we read the config file, but before we do setup for the test,
	// we need to set some values that are dependent upon the config
	readConfig (callback) {
		super.readConfig(error => {
			if (error) { return callback(error); }

			// for default pagination, we'll create "2.5 times the page size" posts,
			// otherwise we'll do 17 posts in pages of 5
			this.numPosts = this.defaultPagination ? Math.floor(this.apiConfig.apiServer.limits.maxPostsPerRequest * 3.5) : 67;
			this.postsPerPage = this.defaultPagination ? this.apiConfig.apiServer.limits.maxPostsPerRequest : 5;
			this.postOptions.postCreateThrottle = this.mockMode ? 0 : 200;	// slow things down, pubnub gets overwhelmed
			this.testTimeout = this.postOptions.numPosts * 500 + 20000;
			this.setTestOptions();
			callback();
		});
	}

	// run the test, this overrides the normal run of GetPostsTest
	run (callback) {
		// we need them sorted for pagination to make sense, expectedPosts is what we'll
		// be comparing the results to
		this.expectedPosts.sort((a, b) => {
			return a.id.localeCompare(b.id);
		});
		// figure out the number of pages we expect
		this.numPages = Math.floor(this.postOptions.numPosts / this.postsPerPage);
		if (this.postOptions.numPosts % this.postsPerPage !== 0) {
			this.numPages++;
		}
		// establish allPosts as the posts across all pages, and expectedPosts as the
		// posts we expect per page
		this.allPosts = this.expectedPosts;
		if (!this.ascending) {
			this.allPosts.reverse();
		}
		// now fetch each page in turn...
		BoundAsync.timesSeries(
			this,
			this.numPages,
			this.fetchPage,
			callback
		);
	}

	// page a single page of posts
	fetchPage (pageNum, callback) {
		this.path = `/posts?teamId=${this.team.id}`;
		if (this.tryOverLimit) {
			// we should get limited to maxPostsPerRequest
			let limit = this.apiConfig.apiServer.limits.maxPostsPerRequest * 2;
			this.path += `&limit=${limit}`;
		}
		else if (!this.defaultPagination) {
			// defining our own page size...
			this.path += `&limit=${this.postsPerPage}`;
		}
		if (this.ascending) {
			// sort in ascending order (unusual)
			this.path += '&sort=asc';
		}
		if (pageNum > 0) {
			// after the first page, we use the last ID fetches and get the next
			// page in sequence
			let op = this.ascending ? 'after' : 'before';
			this.path += `&${op}=${this.lastId}`;
		}
		// fetch the page and validate the response
		this.doApiRequest(
			{
				method: this.method,
				path: this.path,
				token: this.token
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.validatePageResponse(pageNum, response);
				callback();
			}
		);
	}

	// validate the response to a single page fetch
	validatePageResponse (pageNum, response) {
		Assert(typeof response === 'object', `response to page ${pageNum} fetch is not an object`);
		Assert(response.posts instanceof Array, `response.posts for ${pageNum} fetch is not an array`);
		// until the last page, we should get a "more" flag
		if (pageNum + 1 < this.numPages) {
			Assert(response.more === true, `more expected for page ${pageNum}`);
		}
		// check that our response matched the expected "slice", or page
		let begin = pageNum * this.postsPerPage;
		let end = begin + this.postsPerPage;
		this.expectedPosts = this.allPosts.slice(begin, end);
		this.validateResponse(response);
		// prepare for the next page fetch by establishing the ID of the last post fetched
		let lastPost = this.expectedPosts[this.expectedPosts.length - 1];
		this.lastId = lastPost.id;
	}
}

module.exports = ComplexPaginationTest;
