
// return objects that match properties based on the search critiera.
// findCriteria = {
// 	and: {
// 		prop1: val,
// 		prop2: val,
// 		...
// 	},
// 	or: {
// 		prop1: val,
// 		prop2: val,
// 		...
// 	}
// }

function findObjectsBy(listOfObjects, findBy) {
	const results = [];
	listOfObjects.forEach((obj) => {
		let includeIt = false;
		if (findBy.and) {
			includeIt = true;
			for (const prop in findBy.and) {
				if (obj[prop] !== findBy.and[prop]) {
					includeIt = false;
					break;
				}
			}
		}
		if (!includeIt && findBy.or) {
			for (const prop in findBy.or) {
				if (obj[prop] === findBy.or[prop]) {
					includeIt = true;
					break;
				}
			}
		}
		if (includeIt) {
			results.push(obj);
		}
	});
	return results;
};

export default findObjectsBy;
