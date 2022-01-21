// handle creating a new permalink, representing a mapping of IDs to codemark or review IDs 

'use strict';

const UUID = require('uuid').v4;
const Crypto = require('crypto');
const CodemarkLinkIndexes = require('./codemark_link_indexes');

class PermalinkCreator {

	constructor (options) {
		Object.assign(this, options);
	}

	// create a permalink for a codemark or review
	async createPermalink () {
		await this.createLink();	// create the link as needed
		await this.updateCodemark();	// update the codemark as needed
		return this.url;
	}

	// create the link by assigning a UUID, combining it with the team ID
	// link may be public or private
	async createLink () {
		const thing = this.codemark || this.review || this.codeError;
		const type = (
			(this.codemark && 'c') ||
			(this.review && 'r') ||
			(this.codeError && 'e')
		);
		const attr = (
			(this.codemark && 'codemarkId') ||
			(this.review && 'reviewId') ||
			(this.codeError && 'codeErrorId')
		);
		const linkId = UUID().replace(/-/g, '');
		this.url = this.makePermalink(linkId, this.isPublic, thing.teamId, type);
		const hash = this.makeHash(thing, this.markers, this.isPublic, type);

		// upsert the link, which should be collision free
		const update = {
			$set: {
				teamId: thing.teamId,
				md5Hash: hash,
				[attr]: thing.id
			}
		};

		const func = this.request.data.codemarkLinks.updateDirectWhenPersist ||
			this.request.data.codemarkLinks.updateDirect;	// allows for migration script
		await func.call(
			this.request.data.codemarkLinks,
			{ id: linkId },
			update,
			{ upsert: true }
		);
	}

	// encode a link ID using base64 encoding, to shorten it
	encodeLinkId (linkId) {
		return Buffer.from(linkId, 'hex')
			.toString('base64')
			.split('=')[0]
			.replace(/\+/g, '-')
			.replace(/\//g, '_');
	}

	// make the actual permalink
	makePermalink (linkId, isPublic, teamId, type) {
		const origin = this.origin || this.request.api.config.apiServer.publicApiUrl;
		const linkType = type === 'c' ? (isPublic ? 'p' : 'c') : type;
		linkId = this.encodeLinkId(linkId);
		teamId = this.encodeLinkId(teamId);
		return `${origin}/${linkType}/${teamId}/${linkId}`;
	}

	// update the associated codemark as needed
	async updateCodemark () {
		// if this was a public permalink, and the codemark doesn't yet have a public permalink,
		// indicate that it now has one
		if (this.isPublic && this.codemark && !this.codemark.hasPublicPermalink) {
			await this.request.data.codemarks.updateDirectWhenPersist(
				{ id: this.request.data.codemarks.objectIdSafe(this.codemark.id) },
				{ $set: { hasPublicPermalink: true } }
			);
		}
	}

	// given codemark attributes and markers, determine if a link-type codemark has already
	// been created with these exact attributes, as determiend by an MD5 hash ... if we find
	// one, just return it, we won't create a duplicate 
	async findPermalink (attributes, markers, isPublic) {
		// hash the relevant codemark attributes
		const hash = this.makeHash(attributes, markers, isPublic, 'c');

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
			codemarkLink.get ? codemarkLink.get('codemarkId') : codemarkLink.codemarkId
		);
		if (!codemark) {
			return null;
		}
		const teamId = codemark.get ? codemark.get('teamId') : codemark.teamId;
		const url = this.makePermalink(codemarkLink.id, isPublic, teamId, 'c');
		return { permalink: codemarkLink, codemark, url };
	}

	// hash the distinguishing attributes
	makeHash (attributes, markers, isPublic, type) {
		const func = (
			(type === 'c' && 'makeCodemarkHashText') ||
			(type === 'r' && 'makeReviewHashText') ||
			(type === 'e' && 'makeCodeErrorHashText')
		);
		const hashText = this[func](attributes, markers, isPublic);
		return Crypto.createHash('md5').update(hashText).digest('hex');		
	}

	// make the text that reflects the distinguishing characteristics of a codemark,
	// a combination of team, code, repo, file, commit hash, and location
	// if all of these are the same, we should get the same MD5 hash
	makeCodemarkHashText (attributes, markers, isPublic) {
		const markerText = this.makeMarkerHashText(markers);
		const type = attributes.type !== 'link' ? attributes.type : '';
		return `${attributes.teamId}${type}${markerText}${isPublic ? 1 : 0}`;
	}

	// make the text that reflects the distinguishing characteristics of a review,
	// a combination of team, code, repo, file, commit hash, and location
	// if all of these are the same, we should get the same MD5 hash
	makeReviewHashText (attributes, markers) {
		const markerText = this.makeMarkerHashText(markers);
		const reviewText = JSON.stringify(attributes.reviewDiffs || {}) + JSON.stringify(attributes.checkpointReviewDiffs || []);
		return `${attributes.teamId}${markerText}${reviewText}`;
	}

	// make the text that reflects the distinguishing characteristics of a code error,
	// a combination of team, code, repo, file, commit hash, and location
	// if all of these are the same, we should get the same MD5 hash
	makeCodeErrorHashText (attributes, markers) {
		const codeErrorText = JSON.stringify(attributes.stackTraces);
		return `${attributes.accountId}${attributes.objectId}${attributes.objectType}${codeErrorText}`;
	}

	makeMarkerHashText (markers) {
		return (markers || [])
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
	}
}

module.exports = PermalinkCreator;
