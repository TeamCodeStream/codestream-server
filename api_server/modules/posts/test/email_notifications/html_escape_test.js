'use strict';

var EmailNotificationTest = require('./email_notification_test');

const UNESCAPED_HTML = '&<>"\'`=<b>bold</b><p>paragraph</p>';
const ESCAPED_HTML = '&amp;&lt;&gt;&quot;&#39;&#x60;&#x3D;&lt;b&gt;bold&lt;&#x2F;b&gt;&lt;p&gt;paragraph&lt;&#x2F;p&gt;';

class HtmlEscapeTest extends EmailNotificationTest {

	constructor (options) {
		super(options);
		this.wantCodeBlock = true;
	}

	get description () {
		return 'email notification for post with html text and/or code should have the html escaped';
	}

	// make the data to use for the post that triggers the email
	makePostData (callback) {
		// make the default post data
		super.makePostData(() => {
			// store the original text and code so we can construct the proper escaped text and code we
			// want to see in the email output ... then put some html into each of these fields
			let codeBlock = this.data.codeBlocks[0];
			this.originals = {
				text: this.data.text,
				code: codeBlock.code,
				preContext: codeBlock.preContext,
				postContext: codeBlock.postContext
			};
			this.data.text = UNESCAPED_HTML + this.data.text;
			codeBlock.code = UNESCAPED_HTML + codeBlock.code;
			codeBlock.preContext = UNESCAPED_HTML + codeBlock.preContext;
			codeBlock.postContext = UNESCAPED_HTML + codeBlock.postContext;
			callback();
		});
	}

	// validate the message received from pubnub
	validateMessage (data) {
		// since we stored the original text and code, use those and add the escaped html we
		// expect to see in the email output
		this.post.text = ESCAPED_HTML + this.originals.text;
		let codeBlock = this.post.codeBlocks[0];
		codeBlock.code = ESCAPED_HTML + this.originals.code;
		codeBlock.preContext = ESCAPED_HTML + this.originals.preContext;
		codeBlock.postContext = ESCAPED_HTML + this.originals.postContext;
		return super.validateMessage(data);
	}
}

module.exports = HtmlEscapeTest;
