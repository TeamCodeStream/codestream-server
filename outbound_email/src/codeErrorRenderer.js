// provides a class to handle rendering a code error as HTML for email notifications

'use strict';

const Utils = require('./utils');
const RendererBase = require('./rendererBase');

class CodeErrorRenderer extends RendererBase {
	
	constructor() {
		super();
	}

	/* eslint complexity: 0 */
	// renders a large version of the code error
	render (options) {
		return `
<div class="inner-content new-content">
	${this.renderTitleAuthorDiv(options)}
	${this.renderStackTrace(options)}
</div>
`;
	}

	// renders a smaller (collapsed) version of the code erorr
	renderCollapsed (options) {
		const codeErrorAuthorDiv = this.renderAuthorDiv(options);
		const titleDiv = this.renderTitleDiv(options);
		const activityDiv = this.renderActivityDiv(options);
		return `
		<div class="inner-content">
			${codeErrorAuthorDiv}
			${titleDiv}
			${activityDiv}
		</div>`;
	}

	renderReplies (options) {
		const { codeError } = options;
		return super.renderReplies(codeError, options);
	}

	renderParentPost (options) {
		const { parentPost, creator, timeZone } = options;
		const authorOptions = {
			time: parentPost.createdAt,
			creator,
			timeZone,
			datetimeField: 'datetime'
		};
		const authorDiv = Utils.renderAuthorDiv(authorOptions);
		const text = Utils.prepareForEmail(parentPost.text, options);
		const textDiv = `<div><span class="ensure-white">${text}</span></div>`;
		return authorDiv + textDiv;
	}

	// render the div for the title of the code error
	renderTitleDiv (options) {
		const { codeError } = options;
		return Utils.renderTitleDiv(codeError.title, options);
	}

	// render the author line
	renderTitleAuthorDiv (options) {
		const { codeError, creator, timeZone } = options;
		const authorOptions = {
			time: codeError.createdAt,
			creator,
			timeZone,
			datetimeField: 'datetime',
			title: codeError.title,
			icon: 'code-error',
		};
		return Utils.renderTitleAuthorDiv(authorOptions);
	}

	// render the stack trace
	renderStackTrace () {
		const { codeError } = options;
		const stackTrace = codeError.stackTraces[0] || '';
		return `<div>${stackTrace}</div>`;
	}
}

module.exports = CodeErrorRenderer;
