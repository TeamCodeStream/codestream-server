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

	mergeArrayToCollection (collection, array, options = {}) {
		for (let data of array) {
			this.mergeToCollection(collection, data, options);
		}
	}

	mergeToCollection (collection, data, options = {}) {
		this._collections[collection] = this._collections[collection] || {
			itemsById: {},
			items: []
		};

		let item = this._findItemById(data.id);
		if (item) {
			this.applyOpsToItem(item.data, data);
		} else {
			item = { data, tags: [] };
			if (item.data.id) {
				this._collections[collection].itemsById[item.data.id] = item;
				this._collections[collection].items.push(item);
			}
		}

		this._applyTagsToItem(item, collection, options);
	}

	applyOpsToItem (itemData, data) {
		for (let key in data) {
			if (key.startsWith('$')) {
				this.applyOpToItem(itemData, key, data[key]);
				delete data[key];
			}
		}
		Object.assign(itemData, data);
	}

	applyOpToItem (itemData, op, operand) {
		if (typeof operand !== 'object') {
			throw new Array(`cannot apply op to operand of type ${typeof operand}}`);
		}
		for (let attr in operand) {
			const itemValue = itemData[attr];
			const opValue = operand[attr];
			const opElems = opValue instanceof Array ? opValue : [opValue];
			if (op === '$set') {
				itemData[attr] = opValue;
			} else if (op === '$unset' && opValue) {
				delete itemData[attr];
			} else if (op === '$addToSet') {
				if (typeof itemValue === undefined || itemValue instanceof Array) {
					itemValue = itemData[attr] = itemData[attr] || [];
					for (let elem of opElems) {
						if (!itemValue.includes(elem)) {
							itemValue.push(elem);
						}
					}
				}
			} else if (op === '$pull') {
				const itemValue = itemData[attr];
				if (itemValue instanceof Array) {
					for (let elem of opElems) {
						const index = itemValue.indexOf(elem);
						if (index !== -1) {
							itemValue.splice(index, 1);
						}
					}
				}
			} else if (op === '$push') {
				if (typeof itemValue === 'undefined') {
					itemValue = itemData[attr] = itemData[attr] || [];
				}
				if (itemValue instanceof Array) {
					for (let elem of opElems) {
						itemValue.push(elem);
					}
				}
			} 
		}
	}

	_applyTagsToItem (item, collection, options = {}) {
		if (options.addTags || options.addTag) {
			const tags = options.addTags || [options.addTag];
			for (let tag of tags) {
				if (!item.tags.includes(tag)) {
					item.tags.push(tag);
				}
			}
		}
		if (options.deleteTags || options.deleteTag) {
			const tags = options.replaceTags || [options.replaceTag];
			for (let tag of tags) {
				const index = item.tags.indexOf(tag);
				if (index !== -1) {
					item.tags.splice(index, 1);
				}
			}
		}

		if (options.addTagsIfFirst || options.addTagIfFirst) {
			const tags = options.addTagsIfFirst || [options.addTagIfFirst];
			for (let tag of tags) {
				if (!this.findOneByTag(collection, tag)) {
					item.tags.push(tag);
				}
			}
		}
	}

	_findItemByTag (collection, tag) {
		return ((this._collections[collection] || {}).items || []).find(item => {
			return item.tags.includes(tag);
		});
	}

	_filterItemsByTag (collection, tag) {
		return ((this._collections[collection] || {}).items || []).filter(item => {
			return item.tags.includes(tag);
		});
	}

	_findItemById (collection, id) {
		return ((this._collections[collection] || {}).itemsById || {})[id];
	}

	// find the first available item in a collection according to matching tag
	findOneByTag (collection, tag) {
		const item = this._findItemByTag(collection, tag);
		if (item) {
			return item.data;
		}
	}

	// find all the items in a collection according to a matching tag
	findAllByTag (collection, tag) {
		const items = this._filterItemsByTag(collection, tag);
		return items.map(item => item.data);
	}
	
	// find an item in a collection matching the given ID
	findOneById (collection, id) {
		const item = this._findItemById(collection, id);
		if (item) {
			return item.data;
		}
	}

	// remove the specified tag from all items in the given collection
	untagAll (collection, tag) {
		for (let item of ((this._collections[collection] || {}).items || [])) {
			const index = item.tags.indexOf(tag);
			if (index !== -1) {
				item.tags.splice(index, 1);
			}
		}
	}
}

module.exports = TestData;