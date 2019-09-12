const MarkdownIt = require('markdown-it');
const markdownItSlack = require('markdown-it-slack');
const markdownItEmoji = require ('markdown-it-emoji-mart');
 
const htmlEscapeCharMap = {
	'&': '&amp;',
	'<': '&lt;',
	'>': '&gt;',
	'"': '&quot;',
	'\'': '&#039;'
};

function escapeHtml(text) {
	return text.replace(/[&<>"']/g, function (c) {
		return htmlEscapeCharMap[c];
	});
}

const md = new MarkdownIt({
	breaks: true,
	linkify: true,
	highlight: function (str) {        
		const codeHTML = escapeHtml(str);
		return `<pre class="code prettyprint linenums" data-scrollable="true">${codeHTML}</pre>`;
	}
}).use(markdownItSlack)
	.use(markdownItEmoji);

md.renderer.rules.emoji = function (token, idx) {
	return '<span class="emoji">' + token[idx].content + '</span>';
};
 
class Markdowner {
	constructor(options) {
		this.options = options || {};
	}
	
	markdownify(text) {
		try {
			const replaced = md
				.render(text, { references: {} })
				.replace(/blockquote>\n/g, 'blockquote>')
				.replace(/<br>\n/g, '\n')
				.replace(/<\/p>\n$/, '</p>')
				.replace(/<\/p>\n/g, '</p><br/>');
			
			if (text.trim().match(/^(:[\w_+]+:|\s)+$/))
				return '<span class="only-emoji">' + replaced + '</span>';

			else return replaced;
		} catch (error) {
			if (this.options.logger) {
				this.options.logger.warn(`Error rendering markdown: ${error.message}`);
			}
			
			return text;
		}
	}
}

module.exports = Markdowner;