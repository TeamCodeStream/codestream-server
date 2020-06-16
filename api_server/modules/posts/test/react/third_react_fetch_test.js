'use strict';

const SecondReactFetchTest = require('./second_react_fetch_test');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class ThirdReactFetchTest extends SecondReactFetchTest {

	get description () {
		return 'should properly update a post when reacted to a third time, using the same reaction as the first, checked by fetching the post';
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,	// do the usual test prep, including earlier reactions
			this.doThirdReaction	// do a third reaction
		], callback);
	}

	// do a third reaction to the post, using the same reaction as the first
	// the actual test is reading the post and verifying it has all three reactions
	doThirdReaction (callback) {
		const thirdReactor = this.users[2];
		const data = {
			[this.reaction]: true
		};
		this.doApiRequest(
			{
				method: 'put',
				path: '/react/' + this.post.id,
				data: data,
				token: thirdReactor.accessToken
			},
			error => {
				if (error) { return callback(error); }
				this.expectedReactions[this.reaction].push(thirdReactor.user.id);
				callback();
			}
		);
	}
}

module.exports = ThirdReactFetchTest;
