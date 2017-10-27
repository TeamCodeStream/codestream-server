'use strict';

var Get_Posts_Test = require('./get_posts_test');
var Bound_Async = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var Assert = require('assert');
const Limits = require(process.env.CS_API_TOP + '/config/limits');

class Pagination_Test extends Get_Posts_Test {

	constructor (options) {
		super(options);
		this.num_posts = this.default_pagination ? Math.floor(Limits.max_posts_per_request * 2.5) : 17;
		this.posts_per_page = this.default_pagination ? Limits.max_posts_per_request : 5;
	}

	get description () {
		let order = this.ascending ? 'ascending' : 'descending';
		let type = this.default_pagination ? 'default' : 'custom';
		let description = `should return the correct posts in correct ${order} order when requesting posts in ${type} pages`;
		if (this.try_over_limit) {
			description += `, and should limit page size to ${Limits.max_posts_per_request}`;
		}
		return description;
	}

	run (callback) {
		this.num_pages = Math.floor(this.num_posts / this.posts_per_page);
		if (this.num_posts % this.posts_per_page !== 0) {
			this.num_pages++;
		}
		this.all_posts = this.my_posts;
		if (!this.ascending) {
			this.all_posts.reverse();
		}
		Bound_Async.timesSeries(
			this,
			this.num_pages,
			this.fetch_page,
			callback
		);
	}

	fetch_page (page_num, callback) {
		this.path = `/posts/?team_id=${this.team._id}&stream_id=${this.stream._id}`;
		if (this.try_over_limit) {
			this.path += `&limit=${this.try_over_limit}`;
		}
		else if (!this.default_pagination) {
			this.path += `&limit=${this.posts_per_page}`;
		}
		if (this.ascending) {
			this.path += '&sort=asc';
		}
		if (page_num > 0) {
			let op = this.ascending ? 'gt' : 'lt';
			this.path += `&${op}=${this.last_id}`;
		}
		this.do_api_request(
			{
				method: this.method,
				path: this.path,
				token: this.token
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.validate_page_response(page_num, response);
				callback();
			}
		);
	}

	validate_page_response (page_num, response) {
		Assert(typeof response === 'object', `response to page ${page_num} fetch is not an object`);
		Assert(response.posts instanceof Array, `response.posts for ${page_num} fetch is not an array`);
		if (page_num + 1 < this.num_pages) {
			Assert(response.more === true, `more expected for page ${page_num}`);
		}
		let begin = page_num * this.posts_per_page;
		let end = begin + this.posts_per_page;
		this.my_posts = this.all_posts.slice(begin, end);
		this.validate_response(response);
		this.last_id = this.my_posts[this.my_posts.length - 1]._id;
	}
}

module.exports = Pagination_Test;
