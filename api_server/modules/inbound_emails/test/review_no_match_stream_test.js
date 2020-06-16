'use strict';

const ReviewReplyTest = require('./review_reply_test');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class ReviewNoMatchStreamTest extends ReviewReplyTest {

	get description () {
		return 'should return an error when trying to send an inbound email request with a review ID and a stream ID that are not related';
	}

	getExpectedError () {
		return {
			code: 'INBE-1010',
		};
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,			// normal test setup
			this.createOtherStream,	// create another stream in the same team
			this.makePostData
		], callback);
	}

	// create another stream in the same team
	createOtherStream (callback) {
		this.streamFactory.createRandomStream(
			(error, response) => {
				if (error) { return callback(error); }
				this.otherStream = response.stream;
				callback();
			},
			{
				token: this.token,
				teamId: this.team.id,
				type: 'channel'
			}
		);
	}

	// make the data to be used in the request that triggers the message
	makePostData (callback) {
		if (!this.otherStream) { return callback(); }
		super.makePostData(() => {
			// inject the other stream ID
			let toAddress = this.data.to[0].address;
			const atSplit = toAddress.split('@');
			const dotSplit = atSplit[0].split('.');
			dotSplit[1] = this.otherStream.id;
			this.data.to[0].address = `${dotSplit.join('.')}@${atSplit[1]}`;
			callback();
		});
	}
}

module.exports = ReviewNoMatchStreamTest;
