'use strict';

const PrivatePermalinkTest = require('./private_permalink_test');

class WhitespaceReplaceTest extends PrivatePermalinkTest {

	get description () {
		return 'when returning a permalink page, whitespace should be replaced by the appropriate html equivalents';
	}

	createCodemarkForPermalink (callback) {
		this.codemarkData.markers[0].code = 'function () {\n\tfoo();\n    bar();\n}\n';
		this.expectedCode = 'function () {<br/>&nbsp;&nbsp;&nbsp;&nbsp;foo();<br/>&nbsp;&nbsp;&nbsp;&nbsp;bar();<br/>}<br/>';
		super.createCodemarkForPermalink(callback);
	}
}

module.exports = WhitespaceReplaceTest;
