'use strict';

const Migration = require('./migration');

class CodemarkColorToTag extends Migration {

	get description () {
		return 'Converting codemark colors to tags';
	}

	async execute () {
		const codemarks = await this.data.codemarks.getByQuery(
			{ color: { $exists: true }, tags: { $exists: false } },
			{ overrideHintRequired: true }
		);
		await Promise.all(codemarks.map(async codemark => {
			const colorId = `_${codemark.color}`;
			await this.data.codemarks.updateDirect(
				{ id: this.data.codemarks.objectIdSafe(codemark.id) },
				{ $set: { tags: [ colorId ] } }
			);
		}));
	}

	async verify () {
		const codemark = await this.data.codemarks.getOneByQuery(
			{ color: { $exists: true } },
			{ overrideHintRequired: true }
		);
		if (codemark && !codemark.tags) { 
			throw 'found a codemark with a color but without a tag after running migration';
		}
	}
}

module.exports = CodemarkColorToTag;