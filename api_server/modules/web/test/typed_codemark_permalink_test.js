'use strict';

const PrivatePermalinkTest = require('./private_permalink_test');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const Assert = require('assert');

class TypedCodemarkPermalinkTest extends PrivatePermalinkTest {

	constructor (options) {
		super(options);
		this.dontWantPermalinkYet = true;
	}
	
	get description () {
		return `should return the appropriate page for a permalink associated with a ${this.codemarkType} codemark`;
	}

	// create the permalink ... by first creating the typed codemark, then created a permalink for it
	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.createCodemarkLink
		], callback);
	}

	// create a codemark-link, which creates the permalink referencing the codemark
	createCodemarkLink (callback) {
		this.doApiRequest(
			{
				method: 'post',
				path: `/codemarks/${this.codemarkResponse.codemark.id}/permalink`,
				data: { isPublic: this.permalinkType === 'public' },
				token: this.users[1].accessToken
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.path = response.permalink.split(this.apiConfig.api.publicApiUrl)[1];
				callback();
			}
		);
	}

	// validate the response to the test request
	validateResponse (data) {
		const authorSpan = `<span class="author">${this.users[1].user.username}</span>`;
		const titleParagraph = `<p class="title">${this.codemarkData.title}</p>`;
		const textParagraph = `	<p class="text">${this.codemarkData.text}</p>`;
		Assert.notEqual(data.indexOf(authorSpan), -1, 'did not get expected author in the html response');
		Assert.notEqual(data.indexOf(titleParagraph), -1, 'did not get expected title in the html response');
		Assert.notEqual(data.indexOf(textParagraph), -1, 'did not get expected text in the html response');
		const dateMatch = data.match(/<span class="time">(.+)<\/span>/);
		Assert(dateMatch, 'not date span found');

		const activity = this.activityByCodemarkType(this.codemarkType);
		const activitySpan = `<span class="activity">${activity}</span>`;
		Assert.notEqual(data.indexOf(activitySpan), -1, 'did not get expected activity in the html response');

		super.validateResponse(data);
	}

	activityByCodemarkType (type) {
		switch (type) {
		case 'question': 
			return 'has a question';
		case 'issue': 
			return 'posted an issue';
		case 'bookmark': 
			return 'set a bookmark';
		case 'trap':
			return 'created a code trap';
		case 'comment':
		default: // shouldn't happen, just a failsafe
			return 'commented on code';
		}
	}
}

module.exports = TypedCodemarkPermalinkTest;
