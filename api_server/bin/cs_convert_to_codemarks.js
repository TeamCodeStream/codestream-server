#!/usr/bin/env node

/* eslint no-console: 0 */

'use strict';

const MongoClient = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/mongo/mongo_client');
const ApiConfig = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/config/config');
const Commander = require('commander');

Commander
	.option('-d, --destroy', 'Destroy the old properties while creating the new ones')
	.parse(process.argv);

const COLLECTIONS = ['posts', 'markers', 'codemarks'];

class Converter {

	// main entry point
	async go (options = {}) {
		try {
			Object.assign(this, options);
			this.logger = this.logger || console;
			await this.openMongoClient();

			const markers = await this.data.markers.getByQuery(
				{ }, 
				{ overrideHintRequired: true }
			);

			await Promise.all(markers.map(async marker => {
				await this.convertMarker(marker);
			}));
		}
		catch (error) {
			this.logger.error(error);
			process.exit();
		}
		process.exit();
	}

	async convertMarker (marker) {
		let post;
		if (!marker.providerType && marker.postId) {
			post = await this.data.posts.getById(marker.postId);
		}

		let codemark;
		if (!marker.codemarkId) {
			codemark = await this.makeCodemark(marker, post);
			await this.updateMarker(marker, post, codemark);
		}

		if (post && codemark && !post.codemarkId) {
			await this.updatePost(post, codemark);
		}

		if (Commander.destroy) {
			if (post) {
				await this.removeFromPost(post);
			}
			await this.removeFromMarker(marker);
		}
	}

	async makeCodemark (marker, post) {
		const codemark = {
			teamId: marker.teamId,
			streamId: marker.postStreamId || (post && post.streamId),
			postId: marker.postId,
			markerIds: [marker.id.toString()],
			fileStreamIds: [marker.fileStreamId || (marker.codeBlock && marker.codeBlock.streamId) || marker.streamId],
			deactivated: marker.deactivated,
			createdAt: marker.createdAt,
			modifiedAt: marker.modifiedAt,
			creatorId: marker.creatorId
		};
		if (marker.providerType) {
			codemark.providerType = marker.providerType;
		}
		else if (marker.postId.match(/\|/)) {
			codemark.providerType = 'slack';
		}
		if (post) {
			['type', 'color', 'status', 'title', 'assignees', 'text'].forEach(prop => {
				if (post[prop]) {
					codemark[prop] = post[prop];
				}
			});
			if (!post.type) {
				codemark.type = 'comment';
			}
		}
		if (marker.numComments && marker.numComments > 1) {
			codemark.numReplies = marker.numComments - 1;
		}
		return this.data.codemarks.create(codemark);
	}

	async updateMarker (marker, post, codemark) {
		const codeBlock = Object.assign({}, (post && post.codeBlocks && post.codeBlocks[0]) || {}, marker.codeBlock || {});
		if (codeBlock) {
			Object.assign(marker, codeBlock);
			if (marker.location) {
				marker.locationWhenCreated = marker.location;
			}
			delete marker.markerId;
			delete marker.preContext;
			delete marker.postContext;
			delete marker.remotes;
		}
		marker.fileStreamId = codemark.fileStreamIds[0];
		marker.postStreamId = marker.postStreamId || (post && post.streamId);
		marker.codemarkId = codemark.id.toString();
		await this.data.markers.update(marker);
	}

	async updatePost (post, codemark) {
		post.codemarkId = codemark.id.toString();
		await this.data.posts.update(post);
	}

	async removeFromPost (post) {
		const unset = {
			$unset: {
				codeBlocks: true,
				commitHashWhenPosted: true
			}
		};
		if (post.type !== 'comment') {
			unset.$unset.text = true;
		}
		await this.data.posts.updateDirect(
			{ id: this.data.posts.objectIdSafe(post.id) },
			unset
		);
	}

	async removeFromMarker (marker) {
		const unset = {
			$unset: {
				codeBlock: true,
				location: true,
				streamId: true,
				numComments: true,
				commitHash: true,
				preContext: true,
				postContext: true,
				itemId: true
			}
		};
		await this.data.markers.updateDirect(
			{ id: this.data.markers.objectIdSafe(marker.id) },
			unset
		);
	}

	// open a mongo client to do the dirty work
	async openMongoClient () {
		this.mongoClient = new MongoClient({ collections: COLLECTIONS });
		try {
			await this.mongoClient.openMongoClient(ApiConfig.getPreferredConfig().mongo);
			this.data = this.mongoClient.mongoCollections;
		}
		catch (error) {
			throw `unable to open mongo client: ${JSON.stringify(error)}`;
		}
	}
}

(async function() {
	try {
		await ApiConfig.loadPreferredConfig();
		await new Converter().go();
	}
	catch (error) {
		console.error(error);
		process.exit();
	}
})();


