// handle creating a new codemark link, representing a mapping of IDs to codemark IDs 
// for permalinks

'use strict';

const UUID = require('uuid/v4');
const MD5 = require('md5');
const CodemarkLinkIndexes = require('./codemark_link_indexes');

class CodemarkLinkCreator {

	constructor (options) {
		Object.assign(this, options);
	}

	// create a codemark link for a codemark
	async createCodemarkLink () {
		await this.createLink();	// create the link as needed
		await this.updateCodemark();	// update the codemark as needed
		return this.url;
	}

	// create the link by assigning a UUID, combining it with the team ID
	// link may be public or private
	async createLink () {
		const linkId = UUID().replace(/-/g, '');
		this.url = this.makePermalink(linkId, this.isPublic, this.codemark.get('teamId'));
		const hash = this.hashCodemark(this.codemark.attributes, this.markers, this.isPublic);

		// upsert the link, which should be collision free
		const update = {
			$set: {
				teamId: this.codemark.get('teamId'),
				codemarkId: this.codemark.id,
				md5Hash: hash
			}
		};
		await this.request.data.codemarkLinks.updateDirectWhenPersist(
			{ id: linkId },
			update,
			{ upsert: true }
		);
	}

	// make the actual permalink
	makePermalink (linkId, isPublic, teamId) {
		const origin = this.request.api.config.api.publicApiUrl;
		const linkType = isPublic ? 'p' : 'c';
		return `${origin}/${linkType}/${teamId}/${linkId}`;
	}

	// update the associated codemark as needed
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

	// given codemark attributes and markers, determine if a link-type codemark has already
	// been created with these exact attributes, as determiend by an MD5 hash ... if we find
	// one, just return it, we won't create a duplicate 
	async findCodemarkLink (attributes, markers, isPublic) {
		if (attributes.type !== 'link') {
			return;	// only applies to "invisible" link codemarks
		}

		const hash = this.hashCodemark(attributes, markers, isPublic);

		// look for a link that matches this hash exactly
		const codemarkLink = await this.request.data.codemarkLinks.getOneByQuery(
			{ 
				teamId: attributes.teamId,
				md5Hash: hash 
			},
			{
				hint: CodemarkLinkIndexes.byHash
			}
		);
		if (!codemarkLink) {
			return null;
		}

		// found a match, get the codemark itself
		const codemark = await this.request.data.codemarks.getById(
			codemarkLink.get('codemarkId')
		);
		if (!codemark) {
			return null;
		}
		const url = this.makePermalink(codemarkLink.id, isPublic, codemark.get('teamId'));
		return { codemarkLink, codemark, url };
	}

	// hash the distinguishing codemark attributes
	hashCodemark (attributes, markers, isPublic) {
		const hashText = this.makeHashText(attributes, markers, !!isPublic);
		if (!hashText) {
			return;
		}
		return MD5(hashText);
	}

	// make the text that reflects the distinguishing characteristics of a codemark,
	// a combination of team, code, repo, file, commit hash, and location
	// if all of these are the same, we should get the same MD5 hash
	makeHashText (attributes, markers) {
		const markerText = (markers || '')
			.map(marker => {
				return [
					marker.get('code'),
					marker.get('repoId') || '',
					marker.get('fileStreamId') || '',
					marker.get('commitHashWhenCreated') || '',
					JSON.stringify(marker.get('locationWhenCreated') || '')
				].join('');
			})
			.join('');
		if (!markerText) {
			return '';
		}
		return `${attributes.teamId}${markerText}`;
	}
}

module.exports = CodemarkLinkCreator;
