'use strict';

var GetPostsTest = require('./get_posts_test');
var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var Assert = require('assert');
const Limits = require(process.env.CS_API_TOP + '/config/limits');

class PaginationTest extends GetPostsTest {

	constructor (options) {
		super(options);
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

	run (callback) {
		this.myPosts.sort((a, b) => {
			return a._id.localeCompare(b._id);
		});
		this.numPages = Math.floor(this.numPosts / this.postsPerPage);
		if (this.numPosts % this.postsPerPage !== 0) {
			this.numPages++;
		}
		this.allPosts = this.myPosts;
		if (!this.ascending) {
			this.allPosts.reverse();
		}
		BoundAsync.timesSeries(
			this,
			this.numPages,
			this.fetchPage,
			callback
		);
	}

	fetchPage (pageNum, callback) {
		this.path = `/posts/?teamId=${this.team._id}&streamId=${this.stream._id}`;
		if (this.tryOverLimit) {
			let limit = Limits.maxPostsPerRequest * 2;
			this.path += `&limit=${limit}`;
		}
		else if (!this.defaultPagination) {
			this.path += `&limit=${this.postsPerPage}`;
		}
		if (this.ascending) {
			this.path += '&sort=asc';
		}
		if (pageNum > 0) {
			let op = this.ascending ? 'gt' : 'lt';
			this.path += `&${op}=${this.lastId}`;
		}
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

	validatePageResponse (pageNum, response) {
		Assert(typeof response === 'object', `response to page ${pageNum} fetch is not an object`);
		Assert(response.posts instanceof Array, `response.posts for ${pageNum} fetch is not an array`);
		if (pageNum + 1 < this.numPages) {
			Assert(response.more === true, `more expected for page ${pageNum}`);
		}
		let begin = pageNum * this.postsPerPage;
		let end = begin + this.postsPerPage;
		this.myPosts = this.allPosts.slice(begin, end);
		this.validateResponse(response);
		this.lastId = this.myPosts[this.myPosts.length - 1]._id;
	}
}

module.exports = PaginationTest;
