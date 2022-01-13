'use strict';

class TestData {

	constructor (options) {
		Object.assign(this, options);
		this._collections = {};
		this._cache = {};
	}

	getCacheItem (name) {
		return this._cache[name]; 
	}

	setCacheItem (name, item) {
		this._cache[name] = item;
	}

	addToCollection (collection, data, options = {}) {
		this._collections[collection] = this._collections[collection] || [];
		const item = {
			data,
			tags: []
		};


		if (options.tags || options.tag) {
			const tags = options.tags || [options.tag];
			item.tags.push.apply(item.tags, tags);
		}
		if (options.tagsIfFirst || options.tagIfFirst) {
			const tags = options.tagsIfFirst || [options.tagIfFirst];
			tags.forEach(tag => {
				if (!this.findOneByTag(collection, tag)) {
					item.tags.push(tag);
				}
			});
		} 
		this._collections[collection].push(item);
	}

	findOneByTag (collection, tag) {
		const item = (this._collections[collection] || []).find(item => {
			return item.tags.includes(tag);
		});
		if (item) {
			return item.data;
		}
	}

	findAllByTag (collection, tag) {
		const items = (this._collections[collection] || []).filter(item => {
			return item.tags.includes(tag);
		});
		return items.map(item => item.data);
	}
}

module.exports = TestData;