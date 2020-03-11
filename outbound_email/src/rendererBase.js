const Utils = require('./utils');

// this of this as an abstract class
class RendererBase {
	
	constructor() { }
	
	renderCodemarkAuthorDiv (options) {
		const { codemark, parentObjectCreator, timeZone } = options;
		return Utils.renderAuthorDiv({
			time: codemark.createdAt,
			creator: parentObjectCreator,
			timeZone,
			datetimeField: 'parentObjectDatetime'
		});
	}

	renderReviewAuthorDiv (options) {
		const { parentObjectCreator, timeZone, review } = options;
		return Utils.renderAuthorDiv({
			time: review.createdAt,
			creator: parentObjectCreator,
			timeZone,
			datetimeField: 'parentObjectDatetime'
		});
	}
	
	renderTitleDiv (/*options*/) {
		throw Error('override');
	}

	// render the associated icons with all the activity happening with this codemark/review/reply
	renderActivityDiv (options) {
		const watching = this.renderWatching(options);
		const tags = this.renderTags(options);
		const assignees = this.renderAssignees(options);
		const linkedIssue = this.renderLinkedIssue(options);
		const description = this.renderDescription(options);
		const codeBlocks = this.renderCodeBlocks(options);
		const related = this.renderRelatedCodemarks(options);
		const replies = this.renderReplies(options);
		// use .filter to remove any empties
		const html = [
			watching,
			tags,
			assignees,
			linkedIssue,
			description,
			codeBlocks,
			related,
			replies
		].filter(Boolean).join('</td><td valign=middle class="pr-10">');
		return `<div class="reply-icons"><table cellpadding=0 cellspacing=0 border=0><tr><td valign=middle class="pr-10">${html}</td></tr></table></div>`;
	}

	// render the watching icon
	renderWatching (options) {
		return `<span><a clicktracking="off" href="${options.clickUrl}">${Utils.renderIcon('eye')}</a></span>`;
	}

	// render tags and assignees
	renderTags (options) {
		const tags = Utils.renderTags(options);		
		if (!tags) { return ''; }
		return `<span class="reply-tags">${tags}</span>`;
	}

	renderAssignees (options) {		
		const assignees = this.renderAssigneesCore(options);
		if (!assignees) { return ''; }
		return `<span class="reply-tags">${assignees}</span>`;
	}

	// render the headshots or initials of assignees
	renderAssigneesCore (options) {
		const { codemark, review, members } = options;

		let assignees = [];
		// TODO abstract this better
		const parentObjectAssignees = codemark ? codemark.assignees : review.reviewers;
		const externalAssignees = codemark && codemark.externalAssignees;
		(parentObjectAssignees || []).forEach(assigneeId => {
			const user = members.find(member => member.id === assigneeId);
			if (user) {
				assignees.push(user);
			}
		});
		assignees = [...assignees, ...(externalAssignees || [])];

		return assignees.map(assignee => {
			return Utils.renderUserHeadshot(assignee);
		}).join('');
	}

	// render the author line with timestamp
	renderAuthorDiv (options) {
		const { post, creator, timeZone } = options;
		const authorOptions = {
			time: post.createdAt,
			creator,
			timeZone,
			datetimeField: 'datetime'
		};
		return Utils.renderAuthorDiv(authorOptions);
	}

	// render a linked issue icon as needed
	renderLinkedIssue (options) {
		const { codemark } = options;
		if (!codemark || !codemark.externalProvider) { return ''; }
		const providerUrl = codemark.externalProviderUrl;
		const iconHtml = Utils.renderIcon(codemark.externalProvider);
		return `
<span class="reply-icon">
	<a clicktracking="off" href="${providerUrl}">${iconHtml}</a>
</span>
`;
	}

	// render the description icon
	renderDescription (options) {
		return `
		<span class="reply-icon">
			<a clicktracking="off" href="${options.clickUrl}">
				${Utils.renderIcon('description')}
			</a>
		</span>
		`;
	}

	// render the icon for code blocks, and their number
	renderCodeBlocks (options) {
		const { codemark, clickUrl } = options;		
		const numMarkers = ((codemark ? codemark.markerIds : []) || []).length;
		if (numMarkers > 1) {
			const iconHtml = Utils.renderIcon('code');
			return `
<span class="reply-icon">
	<a clicktracking="off" href="${clickUrl}">
		${iconHtml}
		<span class="icon-spaced nice-gray">${numMarkers}</span>
	</a>
</span>
`;
		}
		else {
			return '';
		}
	}

	// render the icon for related codemarks, and their number
	renderRelatedCodemarks (options) {
		const { codemark, clickUrl } = options;
		if (!codemark) { return ''; }
		const numRelated = (codemark.relatedCodemarkIds || []).length;
		if (numRelated) {
			const iconHtml = Utils.renderIcon('codestream');
			return `
<span class="reply-icon">
	<a clicktracking="off" href="${clickUrl}">
		${iconHtml}
		<span class="icon-spaced nice-gray">${numRelated}</span>
	</a>
</span>
`;
		}
		else {
			return '';
		}
	}

	// render the icon for codemark replies, if any, and their number
	renderReplies (parentObject, options) {
		const { clickUrl } = options;
		const numReplies = parentObject.numReplies || 0;
		if (numReplies) {
			const iconHtml = Utils.renderIcon('comment');
			return `
<span class="reply-icon">
	<a clicktracking="off" href="${clickUrl}">
		${iconHtml}
		<span class="icon-spaced nice-gray">${numReplies}</span>
	</a>
</span>
`;
		}
		else {
			return '';
		}
	}

	// render the div for the post text
	renderTextDiv (options) {
		const { post } = options;
		const text = Utils.prepareForEmail(post.text, options);
		return `
<div>
	<span class="ensure-white">${text}</span>
</div>
`;
	}

	renderMeMessageText (options) {		
		const { post, creator, timeZone } = options;
		const meMessageOptions = {			
			creator,
			timeZone,
			datetimeField: 'datetime',
			// remove the `/me ` part
			meMessage: post.text.substring(4),
		};
		return Utils.renderMeMessageDiv(meMessageOptions);
	}

	// render the parent review, if any
	// renderParentReviewDiv (options) {
	// 	const { review, codemark } = options;
	// 	if (review && codemark) {
	// 		// check for both review and codemark as replies
	// 		// to normal codemarks don't necessarily have a parent review
	// 		return Utils.renderParentReviewDiv(options);
	// 	}
	// 	else {
	// 		return '';
	// 	}
	// }

	// renderEarlierReplies(options) {
	// 	const { codemark, review } = options;
	// 	const parentObject = codemark || review;
	// 	if (parentObject.numReplies < 2) {
	// 		return '';
	// 	}

	// 	if (parentObject.permalink) {
	// 		const url = `${parentObject.permalink}?ide=default`;
	// 		return `<div class="replies-earlier"><a href="${url}" clicktracking="off">See earlier replies</a></div>`;
	// 	}
	// 	return '<div class="replies-earlier">See earlier replies</div>';
	// }
}

module.exports = RendererBase;
