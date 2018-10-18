'use strict';

const ReactFetchTest = require('./react_fetch_test');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const RandomString = require('randomstring');

class SecondReactFetchTest extends ReactFetchTest {

	get description () {
		return 'should properly update a post when reacted to a second time, checked by fetching the post';
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,	// do the usual test prep, including a single reaction
			this.doSecondReaction	// do a second reaction
		], callback);
	}

	// do a second reaction to the post
	// the actual test is reading the post and verifying it has both reactions
	doSecondReaction (callback) {
		const secondReaction = RandomString.generate(8);
		const secondReactor = this.users[0];
		const data = {
			[secondReaction]: true
		};
		this.doApiRequest(
			{
				method: 'put',
				path: '/react/' + this.post._id,
				data: data,
				token: secondReactor.accessToken
			},
			error => {
				if (error) { return callback(error); }
				this.expectedReactions[secondReaction] = [secondReactor.user._id];
				callback();
			}
		);
	}
}

module.exports = SecondReactFetchTest;
