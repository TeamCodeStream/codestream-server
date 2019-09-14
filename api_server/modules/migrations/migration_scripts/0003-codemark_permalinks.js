'use strict';

const Migration = require('./migration');
const CodemarkLinkCreator = require(process.env.CS_API_TOP + '/modules/codemarks/codemark_link_creator');
const ApiConfig = require(process.env.CS_API_TOP + '/config/api');
const Marker = require(process.env.CS_API_TOP + '/modules/markers/marker');

const THROTTLE_TIME = 333;

class CodemarkPermalinks extends Migration {

	get description () {
		return 'Setting permalink attribute for all codemarks';
	}

	async execute () {
		const startDate = new Date('2/1/2018').getTime();
		const now = Date.now();
		const oneMonth = 30*24*60*60*1000;
		let currentDate = startDate;
		while (currentDate < now) {
			const codemarks = await this.data.codemarks.getByQuery(
				{
					$and: [
						{ permalink: { $exists: false } },
						{ createdAt: { $gte: currentDate } },
						{ createdAt: { $lt: currentDate + oneMonth } }
					]
				},
				{ overrideHintRequired: true }
			);
			const readableDate = new Date(currentDate).toString().split(' ').slice(1, 4).join(' ');
			this.log(`    Updating ${codemarks.length} codemarks created in month since ${readableDate}`);
			for (const codemark of codemarks) {
				await this.setPermalink(codemark);
				await new Promise(resolve => {
					setTimeout(resolve, THROTTLE_TIME);	
				});
			}
			currentDate += oneMonth;
		}
	}

	async setPermalink (codemark) {
		const markers = await this.getMarkers(codemark);
		let permalink = await this.findExisting(codemark, markers);
		if (!permalink) {
			permalink = await this.makeLink(codemark, markers);
		}
		await this.saveToCodemark(codemark, permalink);
	}

	async getMarkers (codemark) {
		if (codemark.markerIds) {
			return await this.data.markers.getByIds(codemark.markerIds);
		}
		else {
			return [];
		}
	}

	async findExisting (codemark, markers) {
		const info = await new CodemarkLinkCreator({
			request: this,
			origin: ApiConfig.publicApiUrl
		}).findCodemarkLink(
			codemark,
			markers.map(m => new Marker(m))
		);
		return info && info.url;
	}

	async makeLink (codemark, markers) {
		return await new CodemarkLinkCreator({
			request: this,
			codemark: codemark,
			markers: markers.map(m => new Marker(m)),
			origin: ApiConfig.publicApiUrl
		}).createCodemarkLink();
	}

	async saveToCodemark (codemark, permalink) {
		this.data.codemarks.updateDirect(
			{ _id: this.data.codemarks.objectIdSafe(codemark.id) },
			{ $set: { permalink } }
		);
	}

	async verify () {
		const codemark = await this.data.codemarks.getOneByQuery(
			{ permalink: { $exists: false } },
			{ overrideHintRequired: true }
		);
		if (codemark) { 
			throw 'found a codemark with no permalink after running migration';
		}
	}
}

module.exports = CodemarkPermalinks;