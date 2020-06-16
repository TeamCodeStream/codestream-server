'use strict';

var EmailNotificationTest = require('./email_notification_test');

const UNESCAPED_HTML = '&<>"\'`=<b>bold</b><p>paragraph</p>';
const ESCAPED_HTML = '&amp;&lt;&gt;&quot;&#39;&#x60;&#x3D;&lt;b&gt;bold&lt;&#x2F;b&gt;&lt;p&gt;paragraph&lt;&#x2F;p&gt;';

class HtmlEscapeTest extends EmailNotificationTest {

	constructor (options) {
		super(options);
		this.wantMarker = true;
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
			let marker = this.data.markers[0];
			this.originals = {
				text: this.data.text,
				code: marker.code,
				preContext: marker.preContext,
				postContext: marker.postContext
			};
			this.data.text = UNESCAPED_HTML + this.data.text;
			marker.code = UNESCAPED_HTML + marker.code;
			marker.preContext = UNESCAPED_HTML + marker.preContext;
			marker.postContext = UNESCAPED_HTML + marker.postContext;
			callback();
		});
	}

	// validate the message received from pubnub
	validateMessage (data) {
		// since we stored the original text and code, use those and add the escaped html we
		// expect to see in the email output
		this.post.text = ESCAPED_HTML + this.originals.text;
		let marker = this.post.markers[0];
		marker.code = ESCAPED_HTML + this.originals.code;
		marker.preContext = ESCAPED_HTML + this.originals.preContext;
		marker.postContext = ESCAPED_HTML + this.originals.postContext;
		return super.validateMessage(data);
	}
}

module.exports = HtmlEscapeTest;
