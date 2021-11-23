'use strict';

const GetNRCommentsTest = require('./get_nr_comments_test');

class RepliesTest extends GetNRCommentsTest {

	constructor (options) {
		super(options);
		this.numComments = 9;
		this.commentData = [
			,
			,
			{
				replyTo: 1,
			},
			,
			{
				replyTo: 3
			},
			{
				replyTo: 3
			},
			,
			{
				replyTo: 1
			},
			{
				replyTo: 6
			}
		];
	}

	get description () {
		return 'should return New Relic comments when requested, including replies';
	}
}

module.exports = RepliesTest;
