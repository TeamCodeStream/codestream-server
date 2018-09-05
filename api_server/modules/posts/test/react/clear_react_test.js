'use strict';

const ReactTest = require('./react_test');
const RandomString = require('randomstring');

class ClearReactTest extends ReactTest {

	get description () {
		return 'should return a proper directive for updating reactions when a user clears their reaction to a post';
	}

	// before the test runs...
	before (callback) {
		// run standard test setup, but then issue a reaction from the current user, which we'll then clear
		super.before(error => {
			if (error) { return callback(error); }
			this.doReaction(callback);
		});
	}

	// form the data for the reaction
	makePostData (callback) {
		// make data to clear the user's reaction
		this.reaction = RandomString.generate(8);
		this.data = {
			[this.reaction]: false
		};
		this.expectedData = {
			post: {
				_id: this.post._id,
				$pull: {
					[`reactions.${this.reaction}`]: this.currentUser._id
				}
			}
		};
		this.path = '/react/' + this.post._id;
		callback();
	}

	// do the initial reaction, the test will be to clear this reaction
	doReaction (callback) {
		const data = {
			[this.reaction]: true
		};
		this.doApiRequest(
			{
				method: 'put',
				path: '/react/' + this.post._id,
				data: data,
				token: this.token
			},
			callback
		);
	}
}

module.exports = ClearReactTest;
