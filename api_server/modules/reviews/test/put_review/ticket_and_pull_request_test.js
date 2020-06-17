'use strict';

const PutReviewTest = require('./put_review_test');
const Assert = require('assert');
const RandomString = require('randomstring');

class TicketAndPullRequestTest extends PutReviewTest {

	get description () {
		return 'should update ticket and pull request attributes when requested';
	}

	makeReviewUpdateData (callback) {
		super.makeReviewUpdateData(error => {
			if (error) { return callback(error); }
			const newData = {
				pullRequestUrl: `https://github.com/${RandomString.generate(10)}/${RandomString.generate(10)}`,
				pullRequestProviderId: 'github*com',
				ticketUrl: `https://trello.com/${RandomString.generate(10)}/${RandomString.generate(10)}`,
				ticketProviderId: 'trello*com'
			};
			Object.assign(this.data, newData);
			Object.assign(this.expectedData.review.$set, newData);
			callback();
		});
	}
}

module.exports = TicketAndPullRequestTest;
