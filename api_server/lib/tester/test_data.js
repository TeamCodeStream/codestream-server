// Herein we define a class that will be responsible for managing all test data that will
// persist between tests ... data is called out for by a given test and created on demand,
// and stored within an instance of this class

'use strict';

class TestData {

	constructor (options) {
		Object.assign(this, options);
		this._collections = {};
		this._cache = {};
	}

	// get an item from the master cache ... the master cache is reserved for miscellaneous items
	// that don't need to be stored within collections, and can be retrieved simply by name
	getCacheItem (name) {
		return this._cache[name]; 
	}

	// save an item to the master cache ... the master cache is reserved for miscellaneous items
	// that don't need to be stored within collections, and can be retrieved simply by name
	setCacheItem (name, item) {
		this._cache[name] = item;
	}

	// add an item to the given collection, setting tags as needed
	// tags are used to find an item that matches certain conditions, as needed for a given test
	addToCollection (collection, data, options = {}) {
		this._collections[collection] = this._collections[collection] || [];
		const item = {
			data,
			tags: []
		};

		// set tags as desired
		if (options.tags || options.tag) {
			const tags = options.tags || [options.tag];
			item.tags.push.apply(item.tags, tags);
		}

		// some items should be unique, if the given tag is defined as such, set that tag
		// for only the first item we create of that kind
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

	// find the first available item in a collection according to matching tag
	findOneByTag (collection, tag) {
		const item = (this._collections[collection] || []).find(item => {
			return item.tags.includes(tag);
		});
		if (item) {
			return item.data;
		}
	}

	// find all the items in a collection according to a matching tag
	findAllByTag (collection, tag) {
		const items = (this._collections[collection] || []).filter(item => {
			return item.tags.includes(tag);
		});
		return items.map(item => item.data);
	}
}

module.exports = TestData;