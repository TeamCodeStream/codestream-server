'use strict';

const CodemarkLinkTest = require('./codemark_link_test');
const Assert = require('assert');

class SavePermalinkTest extends CodemarkLinkTest {

	constructor (options) {
		super(options);
		this.dontCreatePermalink = true;
	}

	get description () {
		return 'when creating a codemark link for a legacy codemark that does not have a permalink, the permalink should be saved with the codemark';
	}

	run (callback) {
		// we'll run the test twice, but then fetch the codemark and ensure it now has a permalink
		Assert(!this.codemark.permalink, 'original codemark should not have a permalink');
		super.run(error => {
			if (error) { return callback(error); }
			this.doApiRequest(
				{
					method: 'get',
					path: '/codemarks/' + this.codemark.id,
					token: this.token
				},
				(error, response) => {
					if (error) { return callback(error); }
					if (this.permalinkType === 'private') {
						Assert.equal(response.codemark.permalink, this.permalink, 'codemark permalink is not set to the returned permalink');
					} 
					else {
						Assert(!response.codemark.permalink, 'public codemark should not get a permalink');
					}
					callback();
				}
			);
		});
	}
}

module.exports = SavePermalinkTest;
