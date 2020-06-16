class SlackInteractiveComponentBlocks {
	static createRequiresAccess () {
		return [
			{
				type: 'section',
				text: {
					type: 'mrkdwn',
					text: 'If you\'re not a CodeStream user, please sign up.'
				},
				accessory: {
					type: 'button',
					text: {
						type: 'plain_text',
						text: 'Sign Up',
						emoji: true
					},
					url: 'https://codestream.com',
					value: 'click_me_123'
				}
			}
		];
	}

	static createMarkdownBlocks (message) {
		return [
			{
				type: 'section',
				text: {
					type: 'mrkdwn',
					text: message
				}
			}
		];
	}

	static getReplyText (viewState) {
		try {
			return viewState.values['block__text_input--message'][
				'action__text_input--message'
			].value;
		}
		catch (ex) {
			return undefined;
		}
	}

	static createModalReplyBlock () {
		return {
			block_id: 'block__text_input--message',
			type: 'input',
			element: {
				type: 'plain_text_input',
				action_id: 'action__text_input--message',
				multiline: true,
				placeholder: {
					type: 'plain_text',
					text: 'Compose a reply'
				}
			},
			label: {
				type: 'plain_text',
				text: 'Reply'
			}
		};
	}

	static createModalUpdatedView (userThatCreated, userThatClickedIsFauxUser) {
		const blocks = {
			type: 'modal',
			title: {
				type: 'plain_text',
				text: 'Reply Sent'
			},
			close: {
				type: 'plain_text',
				text: 'Close',
				emoji: true
			},
			blocks: [
				{
					type: 'section',
					text: {
						type: 'plain_text',
						text:
							'Reply posted to CodeStream!'
					}
				}
			]
		};
		if (userThatClickedIsFauxUser) {
			blocks.blocks.push({
				type: 'section',
				text: {
					type: 'plain_text',
					text:
						`Have ${(userThatCreated && userThatCreated.get('fullName')) || 'your teammate'} invite you to CodeStream so that you can discuss code right inside your IDE.`
				}
			});
		}
		return blocks;
	}

	static createCodemarkModalView (payload, actionPayload, blocks) {
		return {
			private_metadata: JSON.stringify({
				// creatorId
				crId: actionPayload.crId,
				// streamId
				sId: actionPayload.sId,
				// teamId
				tId: actionPayload.tId,
				// slack userId
				uId: payload.user.id,
				// codemarkId
				cId: actionPayload.cId,				
				// parentPostId
				ppId: actionPayload.ppId,
				// provider creator user id, a slack userId, for example
				pcuId: actionPayload.pcuId
			}),
			type: 'modal',
			callback_id: JSON.stringify({
				// slack actionId
				id: actionPayload.id,				
				// codemarkId
				cId: actionPayload.cId,
				// markerId
				mId: actionPayload.mId
			}),
			title: {
				type: 'plain_text',
				text: 'Post a Reply',
				emoji: true
			},
			submit: {
				type: 'plain_text',
				text: 'Reply',
				emoji: true
			},
			close: {
				type: 'plain_text',
				text: 'Cancel',
				emoji: true
			},
			blocks: blocks
		};
	}

	static createReviewModalView (payload, actionPayload, blocks) {
		return {
			private_metadata: JSON.stringify({
				// creatorId
				crId: actionPayload.crId,
				// streamId
				sId: actionPayload.sId,
				// teamId
				tId: actionPayload.tId,
				// slack userId
				uId: payload.user.id,				
				// reviewId
				rId: actionPayload.rId,
				// parentPostId
				ppId: actionPayload.ppId,
				// provider creator user id, a slack userId, for example
				pcuId: actionPayload.pcuId
			}),
			type: 'modal',
			callback_id: JSON.stringify({
				// id of this slack action
				id: actionPayload.id,
				// reviewId
				rId: actionPayload.rId				
			}),
			title: {
				type: 'plain_text',
				text: 'Post a Reply',
				emoji: true
			},
			submit: {
				type: 'plain_text',
				text: 'Reply',
				emoji: true
			},
			close: {
				type: 'plain_text',
				text: 'Cancel',
				emoji: true
			},
			blocks: blocks
		};
	}
}

module.exports = SlackInteractiveComponentBlocks;
