'use strict';

var GetStreamsTest = require('./get_streams_test');
var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
var Assert = require('assert');
const Limits = require(process.env.CS_API_TOP + '/config/limits');

class PaginationTest extends GetStreamsTest {

	constructor (options) {
		super(options);
		// set up additional pagination options
		this.numStreams = this.defaultPagination ? Math.floor(Limits.maxStreamsPerRequest * 2.5) : 17;
		this.streamsPerPage = this.defaultPagination ? Limits.maxStreamsPerRequest : 5;
		this.dontDoForeign = true;
		this.dontDoTeamStreams = true;
		this.streamCreateThrottle = 100;	// slow things down, pubnub gets overwhelmed
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

	// set the path to use when issuing the test request
	setPath (callback) {
		callback(); // no-op, set path later
	}

	// run the actual test, overriding the base class 
	run (callback) {
		// make sure our expected streams our sorted, since they will come back to us (and are paginated)
		// in sorted order
		this.myStreams = this.streamsByRepo[this.myRepo._id];
		this.myStreams.sort((a, b) => {
			return a._id.localeCompare(b._id);
		});
		// divide into pages
		this.numPages = Math.floor(this.numStreams / this.streamsPerPage);
		if (this.numStreams % this.streamsPerPage !== 0) {
			this.numPages++;
		}
		this.allStreams = this.myStreams;
		if (!this.ascending) {	// reverse order for "asc" sort option
			this.allStreams.reverse();
		}

		// now fetch pages in turn
		BoundAsync.timesSeries(
			this,
			this.numPages,
			this.fetchPage,
			callback
		);
	}

	// fetch a single page of streams and validate the response
	fetchPage (pageNum, callback) {
		this.path = `/streams/?teamId=${this.myTeam._id}&repoId=${this.myRepo._id}`;
		if (this.tryOverLimit) {
			// we'll try to fetch more than the server's limit, we should still get back
			// the maximum number of streams allowed in a page
			let limit = Limits.maxStreamsPerRequest * 2;
			this.path += `&limit=${limit}`;
		}
		else if (!this.defaultPagination) {
			// we'll fetch back a smaller number of streams per page
			this.path += `&limit=${this.streamsPerPage}`;
		}
		if (this.ascending) {
			// we'll fetch in ascending order, rather than descending which is the default
			this.path += '&sort=asc';
		}
		if (pageNum > 0) {
			// after the first page, use the last ID we fetched to fetch the next page
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

	// validate that we got back the expected page of streams
	validatePageResponse (pageNum, response) {
		Assert(typeof response === 'object', `response to page ${pageNum} fetch is not an object`);
		Assert(response.streams instanceof Array, `response.streams for ${pageNum} fetch is not an array`);
		if (pageNum + 1 < this.numPages) {	// more flag should be set except for the last page
			Assert(response.more === true, `more expected for page ${pageNum}`);
		}
		let begin = pageNum * this.streamsPerPage;
		let end = begin + this.streamsPerPage;

		// prepare the expected streams to be the given page, and call the base class validation
		this.myStreams = this.allStreams.slice(begin, end);	
		this.validateResponse(response);

		// record the last ID, we'll fetch the next page using this ID as our page divider
		this.lastId = this.myStreams[this.myStreams.length - 1].sortId;
	}
}

module.exports = PaginationTest;
