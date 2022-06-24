'use strict';

const SharingHelper = require('./sharing_helper');
const SlackUserHelper = require('./slack_user_helper');

const MENTIONS_REGEX = /(^|\s)@(\w+)(?:\b(?!@|[\(\{\[\<\-])|$)/g;
const PSEUDO_MENTIONS_REGEX = /(^|\s)@(everyone|channel|here)(?:\b(?!@|[\(\{\[\<\-])|$)/g;
const ME_MESSAGE_REGEX = /^\/me /;
const MAX_BLOCK_TEXT_LENGTH = 3000;
const REMOTE_PROVIDERS = [
	[
		'github',
		'GitHub',
		/(?:^|\.)github\.com/i,
		(remote, ref, file, start, end) =>
			`https://${remote}/blob/${ref}/${file}#L${start}${start !== end ? `-L${end}` : ""}`
	],
	[
		'gitlab',
		'GitLab',
		/(?:^|\.)gitlab\.com/i,
		(remote, ref, file, start, end) =>
			`https://${remote}/blob/${ref}/${file}#L${start}${start !== end ? `-${end}` : ""}`
	],
	[
		'bitBucket',
		'Bitbucket',
		/(?:^|\.)bitbucket\.org/i,
		(remote, ref, file, start, end) =>
			`https://${remote}/src/${ref}/${file}#${file}-${start}${start !== end ? `:${end}` : ""}`
	],
	[
		'azure-devops',
		'Azure DevOps',
		/(?:^|\.)dev\.azure\.com/i,
		(remote, ref, file, start, end) =>
			`https://${remote}/commit/${ref}/?_a=contents&path=%2F${file}&line=${start}${
				start !== end ? `&lineEnd=${end}` : ""
			}`
	],
	[
		'vsts',
		'Azure DevOps',
		/(?:^|\.)?visualstudio\.com$/i,
		(remote, ref, file, start, end) =>
			`https://${remote}/commit/${ref}/?_a=contents&path=%2F${file}&line=${start}${
				start !== end ? `&lineEnd=${end}` : ""
			}`
	]
];


class SlackSharingHelper extends SharingHelper {

	constructor (options) {
		super(options);
		this.slackUserHelper = new SlackUserHelper({
			request: this.request,
			accessToken: this.accessToken
		});
	}

	/* eslint complexity: 0 */
	async sharePost (post, destination, parentText) {
		const userMap = await this.mapMentionsToSlackUsers(
			post.get('mentionedUserIds'),
			post.get('teamId'),
			destination.teamId
		);
		const channelId = destination.channelId;
		let text = post.get('text');

		if (ME_MESSAGE_REGEX.test(text)) {
			text = text.substring(4);
			if (this.asBot) {
				text = `*${this.request.user.get('username')}* ${text}`;
			}

			const slackText = this.toSlackText(text, userMap, post.get('mentionedUserIds'));
			text = slackText.text;

			const response = await this.slackUserHelper.meMessage({
				channel: channelId,
				thread_ts: destination.parentPostId,
				text
			});

			const { ok, error, ts } = response;
			if (!ok) {
				// TODO: throw useful error
				throw new Error(error);
			}

			let permalink = '';
			const createdAt = ts.split('.')[0] * 1000;

			const permalinkResponse = this.slackUserHelper.getPermalink(channelId, ts);
			if (!permalinkResponse.ok) {
				this.request.log(`Unable to get permalink for ${channelId} ${ts}: ${permalinkResponse.error}`);
			} else {
				permalink = permalinkResponse.permalink;
			}

			return {
				...destination,
				createdAt,
				postId: ts,
				url: permalink
			};
		}

		if (text) {
			const slackText = this.toSlackText(text, userMap, post.get('mentionedUserIds'));
			text = slackText.text;
		}

		const blocks = [];
		if (this.asBot) {
			if (parentText) {
				blocks.push(this.blockRepliedTo(this.request.user.get('username'), parentText));
			} else {
				blocks.push({
					type: 'context',
					elements: [
						{
							type: 'mrkdwn',
							text: `_*${this.request.user.get('username')}* replied via CodeStream_`
						}
					]
				});
			}
		}
		if (post.get('codemarkId')) {
			const codemark = await this.request.data.codemarks.getById(post.get('codemarkId'));
			if (codemark) {
				const codemarkBlocks = await this.toCodemarkBlocks(codemark, [], userMap, [], '');
				blocks.push(...codemarkBlocks);
				text = `${codemark.get('title') || ''}${codemark.get('title') && codemark.get('text') ? '\n\n' : ''}${codemark.get('text') || ''}`;
			}
		} else if (post.get('reviewId')) {
			const review = await this.request.data.reviews.getById(post.get('reviewId'));
			if (review) {
				// unimplemented
				//blocks.concat(this.toReviewBlocks());
				text = `${review.get('title') || ''}${review.get('title') && review.get('text') ? '\n\n' : ''}${review.get('text') || ''}`;
			}
		} else if (post.get('codeErrorId')) {
			const codeError = await this.request.data.codeErrors.getById(post.get('codeErrorId'));
			if (codeError) {
				// unimplemented
				//blocks.concat(this.toCodeErrorBlocks());
				text = codeError.get('title');
			}
		} else if (text) {
			blocks.push({
				type: 'section',
				text: {
					type: 'mrkdwn',
					text: text
				}
			});
		}

		const response = destination.postId
			? await this.slackUserHelper.updateMessage({
				channel: channelId,
				ts: destination.postId,
				text: text,
				blocks: blocks.length ? blocks : undefined
			})
			: await this.slackUserHelper.postMessage({
				channel: channelId,
				text: text,
				unfurl_links: true,
				thread_ts: destination.parentPostId,
				blocks: blocks.length ? blocks : undefined
			});

		const { ok, error, message, ts } = response;
		if (!ok) {
			// TODO: throw error
			throw new Error(error);
		}

		// TODO: sleep(1000)?
		let permalink = '';
		const createdAt = ts.split('.')[0] * 1000;

		const permalinkResponse = this.slackUserHelper.getPermalink(channelId, ts);
		if (!permalinkResponse.ok) {
			this.request.log(`Unable to get permalink for ${channelId} ${ts}: ${permalinkResponse.error}`);
		} else {
			permalink = permalinkResponse.permalink;
		}

		return {
			...destination,
			createdAt,
			postId: ts,
			url: permalink
		};
	}

	async deletePost (destination) {
		if (destination.channelId && destination.postId) {
			const response = await this.slackUserHelper.deleteMessage({
				channel: destination.channelId,
				ts: destination.postId
			});
			const { ok, error } = response;
			if (!ok) {
				throw new Error(error);
			}
		}
	}

	async mapMentionsToSlackUsers (mentions, teamId, slackTeamId) {
		const users = await this.request.data.users.getByIds(mentions || []);
		const userMap = new Map();
		for (const user of users) {
			const key = user.get('username').toLowerCase();
			const slackUserId = 
				user.get('providerInfo') &&
				user.get('providerInfo')[teamId] &&
				user.get('providerInfo')[teamId].slack &&
				user.get('providerInfo')[teamId].slack.multiple &&
				user.get('providerInfo')[teamId].slack.multiple[slackTeamId] &&
				user.get('providerInfo')[teamId].slack.multiple[slackTeamId].data.user_id;
			const value =
				await this.slackUserHelper.getUserFromSlack(slackUserId) ||
				await this.slackUserHelper.getSlackUserByEmail(user.get('email')) ||
				{};
			userMap.set(key, value.user);
		}
		return userMap;
	}

	toSlackText (text, userMap, mentionedUserIds, maxBlockTextLength = MAX_BLOCK_TEXT_LENGTH) {
		if (text == null || text.length === 0) return { text };
		text = text
			.replace('&', '&amp;')
			.replace('<', '&lt;')
			.replace('>', '&gt;');

		if (
			mentionedUserIds === undefined ||
			mentionedUserIds.length !== 0 ||
			(mentionedUserIds.length === 0 && PSEUDO_MENTIONS_REGEX.test(text))
		) {
			text = text.replace(MENTIONS_REGEX, (match, prefix, mentionName) => {
				if (mentionName === 'everyone' || mentionName === 'channel' || mentionName === 'here') {
					return `${prefix}<!${mentionName}>`;
				}

				if (mentionedUserIds === undefined || mentionedUserIds.length !== 0) {
					const normalizedMentionName = mentionName.toLowerCase();
					const slackUser = userMap.get(normalizedMentionName);
					if (slackUser) {
						const slackUserId = slackUser.id;
						return `${prefix}<@${slackUserId}>`;
					}
				}

				return match;
			});
		}
		let wasTruncated = false;
		if (text.length > maxBlockTextLength) {
			text = text.substring(0, maxBlockTextLength - 3) + '...';
			wasTruncated = true;
		}

		return { text, wasTruncated };
	}

	async toCodemarkBlocks (codemark, remotes, userMap, repos, slackUserId) {
		const blocks = this.blocksCodemarkText(codemark, userMap);
		const assigneeBlocks = this.blocksCodemarkAssignees(codemark, userMap);
		blocks.push(...assigneeBlocks);
		if (codemark.get('externalProviderUrl') !== undefined) {
			blocks.push({
				type: 'section',
				text: {
					type: 'mrkdwn',
					text: `*Linked Issues*\n${codemark.get('externalProviderUrl')}`
				}
			});
		}
		if (codemark.get('markerIds') !== undefined && codemark.get('markerIds').length) {
			const markerBlocks = await this.blocksCodemarkMarkers(codemark);
			blocks.push(...markerBlocks);
		} else {
			blocks.push(this.blockCodemarkMarkerless(codemark));
		}
		if (!this.asBot) {
			blocks.push({
				type: 'context',
				// MUST be kept in sync with client slackSharingApi.adapters.ts codemarkAttachmentRegex
				block_id: `codestream://codemark/${codemark.id}?teamId=${codemark.teamId}`,
				elements: [
					{
						type: 'plain_text',
						text: 'Posted via CodeStream'
					}
				]
			});
		}
		return blocks;
	}

	blocksCodemarkText (codemark, userMap) {
		const blocks = [];
		let slackText;
		switch (codemark.get('type')) {
		case 'comment':
		case 'trap': {
			slackText = this.toSlackText(codemark.get('text'), userMap);
			blocks.push({
				type: 'section',
				text: {
					type: 'mrkdwn',
					text: slackText.text
				}
			});
			break;
		}
		case 'bookmark': {
			// Bookmarks use the title rather than text
			slackText = this.toSlackText(codemark.get('title'), userMap);
			blocks.push({
				type: 'section',
				text: {
					type: 'mrkdwn',
					text: slackText.text
				}
			});
			break;
		}
		case 'issue':
		case 'question': {
			let text;
			let textLength = 0;
			if (codemark.get('title')) {
				// we will truncate based on this length below
				text = `*${this.toSlackText(codemark.get('title'), userMap)}*`;
				textLength = text.length;
			}

			if (codemark.get('text')) {
				slackText = this.toSlackText(
					codemark.get('text'),
					userMap,
					undefined,
					text ? MAX_BLOCK_TEXT_LENGTH - (textLength > 0 ? textLength + 1 : 0) : MAX_BLOCK_TEXT_LENGTH
				);
				text = `${text ? `${text}\n` : ''}${slackText.text}`;
			}

			if (text) {
				blocks.push({
					type: 'section',
					text: {
						type: 'mrkdwn',
						text: text
					}
				});
			}
			break;
		}
		}

		if (slackText && slackText.wasTruncated) {
			blocks.push(this.blockTruncated());
		}
		return blocks;
	}

	blocksCodemarkAssignees (codemark, userMap) {
		const blocks = [];
		if (codemark.get('assignees') !== undefined && codemark.get('assignees').length !== 0) {
			const assigneeText = this.toAssigneeText(codemark.get('assignees'), userMap);
			if (assigneeText) {
				blocks.push({
					type: 'section',
					text: {
						type: 'mrkdwn',
						text: `*Assignees*\n${assigneeText}`
					}
				});
			}
		}

		if (
			codemark.get('externalProvider') !== undefined &&
			codemark.get('externalAssignees') !== undefined &&
			codemark.get('externalAssignees').length !== 0
		) {
			blocks.push({
				type: 'section',
				text: {
					type: 'mrkdwn',
					text: `*Assignees*\n${codemark.get('externalAssignees').map(a => a.displayName).join(', ')}`
				}
			});
		}
		return blocks;
	}

	async blocksCodemarkMarkers (codemark, remotes) {
		let blocks = [];
		let counter = 0;
		const markers = await this.request.data.markers.getByIds(codemark.get('markerIds'));
		for (const marker of markers) {
			counter++;

			let { filename, start, end } = this.getMarkerFileData(marker);

			let repo;
			if (marker.get('repoId')) {
				repo = await this.request.data.repos.getById(marker.get('repoId'));
			}
			const url = this.getMarkerUrlData(marker, repo, remotes, start, end);

			if (repo) {
				filename = `[${repo.get('name')}] ${filename}`;
			}

			// don't render backticks for "empty" codeblocks
			let codeText = '';
			if (marker.get('code')) {
				if (/\S+/.test(marker.get('code'))) {
					codeText = marker.get('code');
				} else {
					codeText = '';
				}
			}
			if (codeText) {
				// +1 is for the newline
				const filenameLength = filename ? filename.length + 1 : 0;
				// +6 is for the backticks
				const contentLength = codeText.length + 6 + filenameLength;
				const isTruncated = contentLength > MAX_BLOCK_TEXT_LENGTH;
				blocks.push({
					type: 'section',
					text: {
						type: 'mrkdwn',
						text: `${filename}\n\`\`\`${codeText.substring(
							0,
							MAX_BLOCK_TEXT_LENGTH - filenameLength - 6
						)}\`\`\``
					}
				});
				if (isTruncated) {
					blocks.push(this.blockTruncated());
				}
			} else {
				blocks.push({
					type: 'section',
					text: {
						type: 'mrkdwn',
						text: `${filename}\n`
					}
				});
			}

			let actionId;
			const actions = {
				type: 'actions',
				block_id: `codeblock-actions:${counter}`,
				elements: []
			};

			if (codemark.get('permalink')) {
				actionId = this.toActionId(counter, 'ide', codemark, marker);
				actions.elements.push({
					type: 'button',
					action_id: actionId,
					text: {
						type: 'plain_text',
						text: 'Open in IDE'
					},
					url: `${codemark.get('permalink')}?ide=default&src=Slack&marker=${marker.id}`
				});
			}
			if (url !== undefined && url.url) {
				if (url.url.length <= MAX_BLOCK_TEXT_LENGTH) {
					actionId = this.toExternalActionId(counter, 'code', url.name, codemark, marker);
					actions.elements.push({
						type: 'button',
						action_id: actionId,
						text: {
							type: 'plain_text',
							text: `Open on ${url.displayName}`
						},
						// users can have spaces in the paths to their source code...
						// slack does not like them so they must be escaped
						url: encodeURI(url.url)
					});
				}
			}
			if (actions && actions.elements.length) {
				blocks.push(actions);
			}
		}
		return blocks;
	}

	blockCodemarkMarkerless (codemark) {
		const counter = 1;

		let actionId = this.toActionId(counter, 'ide', codemark);
		return {
			type: 'button',
			action_id: actionId,
			text: {
				type: 'plain_text',
				text: 'Open in IDE'
			},
			url: `${codemark.get('permalink')}?ide=default&src=Slack`
		};
	}

	blockTruncated () {
		return {
			type: 'context',
			elements: [
				{
					type: 'mrkdwn',
					text: 'This was partially truncated. Open in IDE to view it in full.'
				}
			]
		};
	}

	blockRepliedTo (username, text) {
		let replyText;
		const maxText = text.substring(0, 28);
		if (text === maxText) {
			replyText = text;
		} else {
			const match = maxText.match(/(.+\b)\W/);
			const truncatedText = match ? match[1] : maxText;
			replyText = truncatedText === text ? truncatedText : `${truncatedText}...`;
		}
		return {
			type: 'context',
			elements: [
				{
					type: 'mrkdwn',
					text: `_*${username}* replied to "${replyText}" via CodeStream_`
				}
			]
		};
	}

	getMarkerFileData (marker) {
		let start = undefined;
		let end = undefined;
		let filename = marker.get('file');
		if (marker.get('referenceLocations') && marker.get('referenceLocations').length) {
			const markerLocation =
				marker.get('referenceLocations').find(m => m.commitHash === marker.get('commitHashWhenCreated')) ||
				marker.get('referenceLocations')[0];
			if (markerLocation) {
				const location = markerLocation.location;
				if (location && location.length) {
					[start, , end] = location;
					filename = `${marker.get('file')} (Line${start === end ? ` ${start}` : `s ${start}-${end}`})`;
				}
			}
		}
		return { start, end, filename };
	}

	getMarkerUrlData (marker, repo, remotes, start, end) {
		let url = marker.get('remoteCodeUrl');
		if (
			!url &&
			remotes !== undefined &&
			remotes.length !== 0 &&
			start !== undefined &&
			end !== undefined
		) {
			let remoteList;
			if (repo && repo.get('remotes') && repo.get('remotes').length) {
				remoteList = repo.get('remotes').map(_ => _.normalizedUrl);
			}
			if (!remoteList) {
				remoteList = remotes;
			}
			if (remoteList) {
				for (const remote of remoteList) {
					url = this.getRemoteCodeUrl(
						remote,
						marker.get('commitHashWhenCreated'),
						marker.get('file'),
						start,
						end
					);

					if (url !== undefined) {
						break;
					}
				}
			}
		}
		if (url && !url.displayName) {
			url.displayName = this.getProviderDisplayName(url.name) || '';
		}

		return url;
	}

	getProviderDisplayName (name) {
		const provider = REMOTE_PROVIDERS.find(_ => _[0] === name);
		return provider && provider[1];
	}

	getRemoteCodeUrl (remote, ref, file, startLine, endLine) {
		let url;
		for (const [name, displayName, regex, fn] of REMOTE_PROVIDERS) {
			if (!regex.test(remote)) continue;

			url = fn(remote, ref, file, startLine, endLine);
			if (url !== undefined) {
				return { displayName, name, url };
			}
		}
	}

	toActionId (id, linkType, codemark, marker) {
		const actionId = {
			id,
			linkType,
			teamId: codemark.get('teamId'),
			codemarkId: codemark.id,
			markerId: marker && marker.id
		};
		return JSON.stringify(actionId);
	}

	toExternalActionId (id, providerType, provider, codemark, marker) {
		const actionId = {
			id,
			linkType: 'external',
			externalType: providerType,
			externalProvider: provider,
			teamId: codemark.get('teamId'),
			codemarkId: codemark.id,
			markerId: marker && marker.id
		};
		return JSON.stringify(actionId);
	}
}

module.exports = SlackSharingHelper;
