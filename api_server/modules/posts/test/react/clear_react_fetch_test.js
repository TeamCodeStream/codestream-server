'use strict';

const ThirdReactFetchTest = require('./third_react_fetch_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');

class ClearReactFetchTest extends ThirdReactFetchTest {

	get description () {
		return 'should properly update a post when a reaction is cleared, checked by fetching the post';
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,	// do the usual test prep, including earlier reactions
			this.clearReaction	// current user clears their first reaction
		], callback);
	}

	// current user clears their reaction to the post
	// the actual test is reading the post and verifying it has all three reactions
	clearReaction (callback) {
		const data = {
			[this.reaction]: false
		};
		this.doApiRequest(
			{
				method: 'put',
				path: '/react/' + this.post.id,
				data: data,
				token: this.token
			},
			error => {
				if (error) { return callback(error); }
				const index = this.expectedReactions[this.reaction].indexOf(this.currentUser.user.id);
				this.expectedReactions[this.reaction].splice(index, 1);
				callback();
			}
		);
	}
}

module.exports = ClearReactFetchTest;
