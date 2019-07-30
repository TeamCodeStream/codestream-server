'use strict';

const RemoveTagTest = require('./remove_tag_test');

class RemoveFromOtherTagTest extends RemoveTagTest {

	constructor (options) {
		super(options);
		this.expectedVersion = 3;
	}
	
	get description () {
		return 'should be ok to remove a tag from a codemark that already has another tag';
	}

	init (callback) {
		// after initializing, add a different tag to the codemark
		super.init(error => {
			if (error) { return callback(error); }
			this.doApiRequest(
				{
					method: 'put',
					path: `/codemarks/${this.codemark.id}/add-tag`,
					data: {
						tagId: this.otherTagId
					},
					token: this.users[1].accessToken
				},
				callback
			);
		});
	}
}

module.exports = RemoveFromOtherTagTest;
