'use strict';

var GetMarkersTest = require('./get_markers_test');
var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var Assert = require('assert');
const Limits = require(process.env.CS_API_TOP + '/config/limits');

class PaginationTest extends GetMarkersTest {

	constructor (options) {
		super(options);
		this.numMarkers = this.numPosts = Math.floor(Limits.maxMarkersPerRequest * 3.5);
		this.markersPerPage = Limits.maxMarkersPerRequest;
	}

	get description () {
		return `should return the correct markers in correct ${this.order} order when requesting markers in pages`;
	}

	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.createMorePosts
		], callback);
	}

	createMorePosts (callback) {
		this.newCommitHash = this.postFactory.randomCommitHash();
		this.numMissingPosts = Math.floor(this.numPosts / 10);
		BoundAsync.timesSeries(
			this,
			this.numMissingPosts,
			this.createPost,
			callback
		);
	}

	setPostOptions (n) {
		let postOptions = super.setPostOptions(n);
		if (this.newCommitHash) {
			postOptions.commitHash = this.newCommitHash;
		}
		return postOptions;
	}

	run (callback) {
		this.numPages = Math.floor(this.numMarkers / this.markersPerPage) + 1;
		this.fetchedMarkers = [];
		BoundAsync.timesSeries(
			this,
			this.numPages,
			this.fetchPage,
			callback
		);
	}

	fetchPage (pageNum, callback) {
		this.path = `/markers/?teamId=${this.team._id}&streamId=${this.stream._id}&commitHash=${this.commitHash}`;
		if (typeof this.lastLine === 'number') {
			if (this.order === 'ascending') {
				this.path += '&gt=' + this.lastLine;
			}
			else {
				this.path += '&lt=' + this.lastLine;
			}
		}
		else if (this.order === 'descending') {
			this.path += '&lt=99999999';
		}
		this.doApiRequest(
			{
				method: this.method,
				path: this.path,
				token: this.token
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.fetchedMarkers = [...this.fetchedMarkers, ...response.markers];
				this.validatePageResponse(pageNum, response);
				callback();
			}
		);
	}

	getLastLine () {
		const BIG_NUMBER = 9999999999999999;
		if (this.order === 'ascending') {
			return this.fetchedMarkers.reduce((max, marker) => {
				let endLine = marker && marker.location ? (marker.location[1] || marker.location[0]) : -1;
			    return Math.max(max, endLine);
			}, -1);
		}
		else {
			return this.fetchedMarkers.reduce((min, marker) => {
				let startLine = marker && marker.location ? marker.location[0] : BIG_NUMBER;
			    return Math.min(min, startLine);
			}, BIG_NUMBER);
		}
	}

	validatePageResponse (pageNum, response) {
		this.numFetchedMissingPosts = 0;
		if (this.lastLine) {
			this.validateToLastLine(response);
			this.lastLine = this.getLastLine();
		}
		else {
			this.lastLine = this.getLastLine();
			this.validateToLastLine(response, true);
		}
		Assert(this.numFetchedMissingPosts === this.numMissingPosts, 'did not get the expected missing posts');
		if (pageNum + 1 < this.numPages) {
			Assert(response.more === true, `more expected for page ${pageNum}`);
		}
		else {
			Assert(!response.more, 'more was set on last page');
			this.fetchedMarkers.sort((a, b) => {
				return a._id.localeCompare(b._id);
			});
			this.markers.sort((a, b) => {
				return a._id.localeCompare(b._id);
			});
			this.fetchedMarkers = this.fetchedMarkers.filter((marker, n) => {
				return n === 0 || this.fetchedMarkers[n-1]._id !== marker._id;
			});
			let data = {
				markers: this.fetchedMarkers
			};
			super.validateResponse(data);
		}
	}

	validateToLastLine (response, reverse = false) {
		response.markers.forEach(marker => {
			if (!marker.location) {
				this.numFetchedMissingPosts++;
			}
			else if (this.order === 'ascending') {
				let endLine = marker.location[1] || marker.location[0];
				if (reverse) {
					Assert(endLine <= this.lastLine, 'fetched an out of range marker');
				}
				else {
					Assert(endLine >= this.lastLine, 'fetched an out of range marker');
				}
			}
			else {
				let startLine = marker.location[0];
				if (reverse) {
					Assert(startLine >= this.lastLine, 'fetched an out of range marker');
				}
				else {
					Assert(startLine <= this.lastLine, 'fetched an out of range marker');
				}
			}
		});
	}
}

module.exports = PaginationTest;
