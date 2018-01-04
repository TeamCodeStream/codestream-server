'use strict';

var GetStreamsTest = require('./get_streams_test');
var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var Assert = require('assert');
const Limits = require(process.env.CS_API_TOP + '/config/limits');

class PaginationTest extends GetStreamsTest {

	constructor (options) {
		super(options);
		this.numStreams = this.defaultPagination ? Math.floor(Limits.maxStreamsPerRequest * 2.5) : 17;
		this.streamsPerPage = this.defaultPagination ? Limits.maxStreamsPerRequest : 5;
		this.dontDoForeign = true;
		this.dontDoTeamStreams = true;
		this.createStreamThrottle = 100;
	}

	get description () {
		let order = this.ascending ? 'ascending' : 'descending';
		let type = this.defaultPagination ? 'default' : 'custom';
		let description = `should return the correct streams in correct ${order} order when requesting streams in ${type} pages`;
		if (this.tryOverLimit) {
			description += `, and should limit page size to ${Limits.maxStreamsPerRequest}`;
		}
		return description;
	}

	setPath (callback) {
		callback(); // no-op, set path later
	}

	run (callback) {
		this.myStreams = this.streamsByRepo[this.myRepo._id];
		this.myStreams.sort((a, b) => {
			return a._id.localeCompare(b._id);
		});
		this.numPages = Math.floor(this.numStreams / this.streamsPerPage);
		if (this.numStreams % this.streamsPerPage !== 0) {
			this.numPages++;
		}
		this.allStreams = this.myStreams;
		if (!this.ascending) {
			this.allStreams.reverse();
		}
		BoundAsync.timesSeries(
			this,
			this.numPages,
			this.fetchPage,
			callback
		);
	}

	fetchPage (pageNum, callback) {
		this.path = `/streams/?teamId=${this.myTeam._id}&repoId=${this.myRepo._id}`;
		if (this.tryOverLimit) {
			let limit = Limits.maxStreamsPerRequest * 2;
			this.path += `&limit=${limit}`;
		}
		else if (!this.defaultPagination) {
			this.path += `&limit=${this.streamsPerPage}`;
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
		Assert(response.streams instanceof Array, `response.streams for ${pageNum} fetch is not an array`);
		if (pageNum + 1 < this.numPages) {
			Assert(response.more === true, `more expected for page ${pageNum}`);
		}
		let begin = pageNum * this.streamsPerPage;
		let end = begin + this.streamsPerPage;
		this.myStreams = this.allStreams.slice(begin, end);
		this.validateResponse(response);
		this.lastId = this.myStreams[this.myStreams.length - 1].sortId;
	}
}

module.exports = PaginationTest;
