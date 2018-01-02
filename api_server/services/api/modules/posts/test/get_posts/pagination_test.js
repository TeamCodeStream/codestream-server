'use strict';

var GetPostsTest = require('./get_posts_test');
var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var Assert = require('assert');
const Limits = require(process.env.CS_API_TOP + '/config/limits');

class PaginationTest extends GetPostsTest {

	constructor (options) {
		super(options);
		// for default pagination, we'll create "2.5 times the page size" posts,
		// otherwise we'll do 17 posts in pages of 5
		this.numPosts = this.defaultPagination ? Math.floor(Limits.maxPostsPerRequest * 2.5) : 17;
		this.postsPerPage = this.defaultPagination ? Limits.maxPostsPerRequest : 5;
	}

	get description () {
		let order = this.ascending ? 'ascending' : 'descending';
		let type = this.defaultPagination ? 'default' : 'custom';
		let description = `should return the correct posts in correct ${order} order when requesting posts in ${type} pages`;
		if (this.tryOverLimit) {
			description += `, and should limit page size to ${Limits.maxPostsPerRequest}`;
		}
		return description;
	}

	// run the test, this overrides the normal run of GetPostsTest
	run (callback) {
		// we need them sorted for pagination to make sense, myPosts is what we'll
		// be comparing the results to
		this.myPosts.sort((a, b) => {
			return a._id.localeCompare(b._id);
		});
		// figure out the number of pages we expect
		this.numPages = Math.floor(this.numPosts / this.postsPerPage);
		if (this.numPosts % this.postsPerPage !== 0) {
			this.numPages++;
		}
		// establish allPosts as the posts across all pages, and myPosts as the
		// posts we expect per page
		this.allPosts = this.myPosts;
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
		this.path = `/posts/?teamId=${this.team._id}&streamId=${this.stream._id}`;
		if (this.tryOverLimit) {
			// we should get limited to maxPostsPerRequest
			let limit = Limits.maxPostsPerRequest * 2;
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
			let op = this.ascending ? 'gt' : 'lt';
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
		this.myPosts = this.allPosts.slice(begin, end);
		this.validateResponse(response);
		// prepare for the next page fetch by establishing the ID of the last post fetched
		let lastPost = this.myPosts[this.myPosts.length - 1];
		this.lastId = lastPost._id;
	}
}

module.exports = PaginationTest;
