// handle creating a new codemark link, representing a mapping of IDs to codemark IDs 
// for permalinks

'use strict';

const UUID = require('uuid/v4');

class CodemarkLinkCreator {

	constructor (options) {
		Object.assign(this, options);
	}

	async createCodemarkLink () {
		await this.createLink();
		await this.updateCodemark();
		return this.url;
	}

	async createLink () {
		const linkId = UUID().replace(/-/g, '');
		const origin = this.request.api.config.api.publicApiUrl;
		const linkType = this.isPublic ? 'p' : 'c';
		this.url = `${origin}/${linkType}/${this.teamId}/${linkId}`;

		const update = {
			$set: {
				teamId: this.teamId,
				codemarkId: this.codemark.id
			}
		};
		await this.request.data.codemarkLinks.updateDirectWhenPersist(
			{ id: linkId },
			update,
			{ upsert: true }
		);
	}

	async updateCodemark () {
		// if this was a public permalink, and the codemark doesn't yet have a public permalink,
		// indicate that it now has one
		if (this.isPublic && !this.codemark.get('hasPublicPermalink')) {
			await this.request.data.codemarks.updateDirectWhenPersist(
				{ id: this.request.data.codemarks.objectIdSafe(this.codemark.id) },
				{ $set: { hasPublicPermalink: true } }
			);
		}
	}
}

module.exports = CodemarkLinkCreator;
