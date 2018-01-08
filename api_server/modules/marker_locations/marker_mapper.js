'use strict';

const MarkerData = require('./marker_data');
const StringSimilarity = require('string-similarity');
const BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');

const LINE_SIMILARITY_THRESHOLD = 0.6;
const EDIT_SIMILARITY_THRESHOLD = 0.5;
const DELETED = MarkerData.DELETED;

function sortNumber(a, b) {
	return a - b;
}

function sortRatings(a, b) {
	return a.rating - b.rating;
}

/**
 * This class performs the mapping (or recalculation) of marker's positional
 * information given a list of edits.
 */
class MarkerMapper {

	constructor (markerLocations, edits) {
		this.lines = []; // list of line numbers we care about
		this.lineMap = {};
		this.inputMarkerLocations = markerLocations;
		this.edits = edits;
		this.lineIdx = 0;
	}

	/**
	 * Returns the new position information (lines and columns) of
	 * all marker locatins based on the list of edits
	 */
	getUpdatedMarkerData (callback) {
		BoundAsync.series(this, [
			this.setMarkersData,
			this.applyEdits,
			this.recalculateLinesUntilEnd,
			this.assignNewLines,
			this.recalculateMissingMarkers,
			this.recalculateColumns,
			this.generateOutputMarkers
		], error => {
			callback(error, this.outputMarkerLocations);
		});
	}

	/**
	 * Prepare for our calculation by converting from location arrays into
	 * convenience objects (MarkerData) and making note of the lines we are
	 * going to be interested in
	 */
	setMarkersData (callback) {
		// marker locations look like this:
		// {
		//    <markerId>: <location>,
		//    <markerId>: <location>,
		//    ...
		// }
		//
		// so we'll turn this into an array of MarkerData objects which will
		// be more convenient for us to use
		this.markersData = [];
		const markerIds = Object.keys(this.inputMarkerLocations);
		markerIds.forEach(markerId => {
			const location = this.inputMarkerLocations[markerId];
			let markerData = new MarkerData(markerId, location, this);
			this.markersData.push(markerData);
			// make a note of the lines we are interested in, these will get
			// "mapped" to new line numbers by the calculation
			this.addLine(markerData.lineStartOld);
			this.addLine(markerData.lineEndOld);
		});
		// the lines must be sorted for the calculation to work properly
		this.lines.sort(sortNumber);
		process.nextTick(callback);
	}

	/**
	 * Add a line of interest, we'll store the lines in sequential order
	 * and also a mapping between "old" lines and "new" lines, which are
	 * the result of our calculations
	 */
	addLine (line) {
		// skip multiple markers pointing to the same line
		if (!this.lineMap[line]) {
			this.lineMap[line] = { oldLine: line };
			this.lines.push(line);
		}
	}

	/**
	 * Apply our series of edits to the marker location data, calculating
	 * new line number locations along the way
	 */
	applyEdits (callback) {
		// keep this async, we allow the node process to serve other requests
		// while this calculation is going on ... in other words, don't
		// block for too long! (this is expensive)
		BoundAsync.forEachSeries(
			this,
			this.edits,
			this.applyEdit,
			callback
		);
	}

	/**
	 * Apply a single edit to determine what line numbers are changed by it
	 */
	applyEdit (edit, callback) {
		this.recalculateLinesUntil(edit);	// recalculate all the lines "leading up to" this edit
		this.recalculateLinesIn(edit);		// recalculate all the lines directly touched by this edit
		process.nextTick(callback);
	}

	/**
	 * Recalculate the position of all lines for which we have markers, up to
	 * the next edit
	 */
	recalculateLinesUntil (edit) {
		const editStart = edit.delStart;
		const balance = edit.addStart - edit.delStart;
		while (this.getCurrentLine() < editStart) {
			this.moveCurrentLineBy(balance);
			this.nextLine();
		}
	}

	/**
	 * Recalculate the position of lines for which we have markers, that are
	 * directly touched by the edit ... we look for similar lines in the lines
	 * that were added, and if we find any, we can say with reasonable assurance
	 * how those lines have been moved (and therefore the markers referencing them)
	 * This is based on comparing lines for similarity, a somewhat fuzzy proposition
	 */
	recalculateLinesIn (edit) {
		let line;

		// figure out our "final balance", which we'll use at the end to adjust all
		// the lines "after" our final edit
		const initialBalance = edit.addStart - edit.delStart;
		const editLength = edit.addLength - edit.delLength;
		this.finalBalance = initialBalance + editLength;

		// for every line of interest "within" the edit, try to find a matching line,
		// and move the marker there ... otherwise we'll call the line with the marker
		// truly "deleted"
		const delEnd = edit.delStart + edit.delLength;
		while ((line = this.getCurrentLine()) < delEnd) {
			let delIndex = line - edit.delStart;
			let delContent = edit.dels[delIndex];
			let addContent = this.findSimilarContentInAdditions(delContent, edit);
			let addIndex = edit.adds.indexOf(addContent);
			let newLine = addIndex >= 0 && edit.addStart + addIndex;

			let lineData = this.lineMap[line];
			lineData.newLine = newLine || DELETED; // mark this marker as deleted, but we may still find it later...
			lineData.delContent = delContent;
			lineData.addContent = addContent;
			lineData.edit = edit;

			this.nextLine();
		}
	}

	// get the next line of interest
	getCurrentLine () {
		return this.lines[this.lineIdx];
	}

	// increment our pointer to the lines of interest
	nextLine () {
		this.lineIdx++;
	}

	// we now know that the current line of interest must move by "delta"
	moveCurrentLineBy (delta) {
		const line = this.getCurrentLine();
		this.lineMap[line].newLine = line + delta;
	}

	/**
	 * Given some content, attempt to find the best good match for that content
	 * within content that was added in this edit, using a string similarity
	 * algorithm ... we'll call it a match for the line if it meets a certain
	 * target threshold
	 */
	findSimilarContentInAdditions (content, edit) {
		const adds = edit.adds;
		if (!adds.length) {
			return null;
		}
		const bestMatch = StringSimilarity.findBestMatch(content, edit.adds).bestMatch;
		return bestMatch.rating >= LINE_SIMILARITY_THRESHOLD ? bestMatch.target : null;
	}

	/**
	 * When we are done recalculating line numbers based on the edits, adjust the
	 * line numbers after the last edit according to the "final balance"
	 */
	recalculateLinesUntilEnd (callback) {
		let line;
		const balance = this.finalBalance;
		while ((line = this.getCurrentLine())) {
			this.moveCurrentLineBy(balance);
			this.nextLine();
		}
		process.nextTick(callback);
	}

	/**
	 * For every line of interest, we now know the mapping from the line number
	 * in the old file to the line number in the new file, so we assign those
	 * new line numbers to the actual marker data here
	 */
	assignNewLines (callback) {
		const lineMap = this.lineMap;

		// for each marker (which has a start line and an end line),
		// get the line number in the new file, and also
		// store the contents deleted and the contents added for that line ...
		// we'll use that later when trying to deal with column positions
		for (let markerData of this.markersData) {
			let startLineData = lineMap[markerData.lineStartOld];
			if (startLineData) {
				markerData.lineStartNew = startLineData.newLine;
				markerData.lineStartOldContent = startLineData.delContent;
				markerData.lineStartNewContent = startLineData.addContent;
			}
			let endLineData = lineMap[markerData.lineEndOld];
			if (endLineData) {
				markerData.lineEndNew = endLineData.newLine;
				markerData.lineEndOldContent = endLineData.delContent;
				markerData.lineEndNewContent = endLineData.addContent;
			}
		}
		process.nextTick(callback);
	}

	/**
	 * Recalculate the column numbers for all our markers, making a best guess
	 * as to how the column positions may have changed given the contents between
	 * the old and new line ... this is fuzzy
	 */
	recalculateColumns (callback) {
		// keep this async, we allow the node process to serve other requests
		// while this calculation is going on ... in other words, don't
		// block for too long! (this is expensive)
		BoundAsync.forEachSeries(
			this,
			this.markersData,
			this.recalculateColumnPair,
			callback
		);
	}

	/**
	 * Attempt to figure out new positions for column numbers of a marker
	 * by comparing the content that has changed in a given line
	 */
	recalculateColumnPair (markerData, callback) {
		let colStartNew = markerData.colStartNew;
		let colEndNew = markerData.colEndNew;

		// don't bother if the start of the marker was in deleted code
		if (!markerData.info.startWasDeleted) {
			colStartNew = this.recalculateColumn(
				markerData.colStartOld,
				markerData.lineStartOldContent,
				markerData.lineStartNewContent
			);
			if (colStartNew === DELETED) {
				// give up and move to beginning of line
				markerData.info.startWasDeleted = true;
				colStartNew = 1;
			}
		}

		// don't bother if the end of the marker was in deleted code
		if (!markerData.info.endWasDeleted) {
			colEndNew = this.recalculateColumn(
				markerData.colEndOld,
				markerData.lineEndOldContent,
				markerData.lineEndNewContent
			);
			if (colEndNew === DELETED) {
				// give up and move to end of line
				colEndNew = markerData.lineEndNewContent.length;
				markerData.info.endWasDeleted = true;
			}
		}

		// if we end up with a start position greater than the end position, just
		// give up and mark the whole line
		if (markerData.lineStartNew === markerData.lineEndNew && colStartNew > colEndNew) {
			markerData.colStartNew = 1;
			markerData.colEndNew = markerData.lineEndNewContent.length;
		}
		else {
			markerData.colStartNew = colStartNew;
			markerData.colEndNew = colEndNew;
		}

		process.nextTick(callback);
	}

	/**
	 * Recalculates a column number based on the line's old and new contents. In
	 * order to find the corresponding column (position) in the new content,
	 * we take into account:
	 *
	 * - pre: 3 characters before column oldCol
	 * - mid: character at column oldCol
	 * - pos: 3 characters after column oldCol
	 *
	 * Since the substring pre+mid+pos may occur more than once in the old line,
	 * we calculate its specific index, which indicates which occurrence is located
	 * around oldCol.
	 *
	 * Example: "aaaabcdefghbcdefgh"
	 *           123456789012345678
	 *
	 * oldCol: 8  => pre: bcd, mid: e, pos: fgh, specificIndex: 0
	 * oldCol: 15 => pre: bcd, mid: e, pos: fgh, specificIndex: 1
	 * oldCol: 1  => pre:    , mid: a, pos: aaa, specificIndex: 0
	 *
	 * In possession of pre, mid, pos and specificIndex, we search all occurrences
	 * of pre+mid+pos in the new line and return the column number associated with
	 * mid at the specificIndex. In case pre+mid+pos is not found in the new line,
	 * we remove pre's first character and pos' last character and try again, until
	 * pre and pos are both empty, at which point we give up and assume the content
	 * is no longer present in the new line.
	 *
	 * Example:
	 * oldLine: function foo() {
	 *          1234567890123456
	 * newLine: function fooRenamed() {
	 *          12345678901234567890123
	 * oldCol: 14 => pre: "oo(", mid: ")", pos: " {", specificIndex: 0
	 *
	 * 1st attempt: "oo() {" => not found
	 * 2nd attempt: "o() "   => not found
	 * 3rd attempt: "()"     => found, with mid ")" at column 21
	 *
	 * Therefore, newCol = 20
	 *
	 * Example:
	 * oldLine: return (foo && bar) || (baz && bar)
	 *          12345678901234567890123456789012345
	 * newLine: return !(foo && bar) || !(baz && bar)
	 *          1234567890123456789012345678901234567
	 * oldCol: 34 => pre: " ba", mid: "r", pos: ")", specificIndex: 1
	 *
	 * 1st attempt: " bar)" => found, with mid "r" at columns 19 and 36
	 *
	 * Therefore, since specificIndex is 1, newCol = 36
	 */
	recalculateColumn (oldCol, oldContent, newContent) {
		if (!oldContent || !newContent || oldContent === newContent) {
			return oldCol;
		}
		if (oldCol > oldContent.length) {
			oldCol = oldContent.length;
		}

		let pre = oldContent.substring(oldCol - 4, oldCol - 1);
		const mid = oldContent.substring(oldCol - 1, oldCol);
		let pos = oldContent.substring(oldCol, oldCol + 3);

		while (true) {
			const str = pre + mid + pos;

			const oldContentPositions = this._positionsOfContent(str, oldContent, pre.length);
			const specificIndex = oldContentPositions.indexOf(oldCol);
			const newContentPositions = this._positionsOfContent(str, newContent, pre.length);

			const newColumn =
				newContentPositions[specificIndex] ||
				newContentPositions[newContentPositions.length - 1];
			if (newColumn) {
				return newColumn;
			}

			if (!pre.length && !pos.length) {
				break;
			}

			pre = pre.substring(1, pre.length);
			pos = pos.substring(0, pos.length - 1);
		}

		return DELETED;
	}

	// helper to locate positions of given content in the passed string
	_positionsOfContent (str, content, preLength) {
		let contentPositions = [];
		let i = content.indexOf(str);
		while (i > -1) {
			contentPositions.push(i + preLength + 1);
			i = content.indexOf(str, i + 1);
		}
		return contentPositions;
	}

	/**
	 * Iterate over markers that had its starting line(s) and/or ending line(s)
	 * deleted. If the marker has at least some of its original content preserved,
	 * then we simply trim the removed parts. If the marker was entirely deleted,
	 * then we try to find it by looking at all edits in the file.
	 *
	 * TODO room for improvement here: we could also look at edits in other files
	 * to try to find blocks of code moved from one file to another
	 */
	recalculateMissingMarkers (callback) {
		// keep this async, we allow the node process to serve other requests
		// while this calculation is going on ... in other words, don't
		// block for too long! (this is expensive)
		BoundAsync.forEachSeries(
			this,
			this.markersData,
			this.recalculateMissingMarker,
			callback
		);
	}

	/**
	 * For a single marker, attempt to fix a deletion in its starting and/or ending
	 * line number ... see recalculateMissingMarkers() above
	 */
	recalculateMissingMarker (marker, callback) {
		if (marker.isEntirelyDeleted()) {
			// maybe it was moved somewhere else?
			if (!this.findMovedMarker(marker)) {
				marker.trimLineEdit(); // give up and put a zero-length marker after the edit
			}
		}
		else if (marker.isLineStartDeleted()) {
			// move to the first line after the edit
			marker.trimLineStartEdit();
		}
		else if (marker.isLineEndDeleted()) {
			// move to the first line before the edit
			marker.trimLineEndEdit();
		}
		process.nextTick(callback);
	}

	/**
	 * Try to find a moved marker. A marker will only be considered moved if:
	 *
	 * - it is a single-line marker, and was deleted in an edit
	 * - it is a multi-line marker, and its entire range was deleted by a single
	 *   edit - this is important as we don't want to chase around a marker if
	 *   at least part of its content was preserved
	 *
	 * 1) we gather the contents of the edit that deleted the marker
	 * 2) we find all edits that added new contents that match the contents
	 *    from (1) with a minimum similarity level defined by EDIT_SIMILARITY_THRESHOLD
	 * 3) we iterate over the edits from (2), in order of similarity (best matches first)
	 * 4) for each edit, we look at its added lines and find the lines that best
	 *    match the marker's original starting and ending (if multi-line) lines
	 * 5) if we find such lines and they have a minimum similarity level defined
	 *    by LINE_SIMILARITY_THRESHOLD, and they are in order (start < end), then
	 *    we say we found the marker
	 * 6) if we exhaust all edits from (4) without finding lines (5), then we
	 *    consider the marker as truly deleted
	 */
	findMovedMarker (marker) {
		// if a multiline marker is considered moved, it means that both its
		// startLineEdit and endLineEdit are the same, so we can always get
		// the content from lineStartEdit
		const deletedContent = marker.getLineStartEditDeletedContent();
		const matchingEdits = this.findEditsWithSimilarAddedContent(deletedContent);

		for (const edit of matchingEdits) {
			const adds = edit.adds;
			const lineStartIndex = this.getBestMatchingLineIndex(
				marker.getLineStartDataDeletedContent(),
				adds
			);

			if (lineStartIndex === -1) {
				continue;
			}

			if (marker.isMultiLine()) {
				const lineEndIndex = this.getBestMatchingLineIndex(
					marker.getLineEndDataDeletedContent(),
					adds
				);

				if (lineEndIndex === -1) {
					continue;
				}

				if (lineStartIndex > lineEndIndex) {
					// TODO room for improvement - check 2nd, 3rd best matches.
					// that would require collecting and ranking candidates from
					// all matching edits before deciding which one is the most
					// similar
					continue;
				}

				marker.lineEndNewContent = adds[lineEndIndex];
				marker.lineEndNew = edit.addStart + lineEndIndex;
				marker.lineStartNewContent = adds[lineStartIndex];
				marker.lineStartNew = edit.addStart + lineStartIndex;
				return true;
			}
			else {
				marker.lineStartNewContent = marker.lineEndNewContent = adds[lineStartIndex];
				marker.lineStartNew = marker.lineEndNew = edit.addStart + lineStartIndex;
				return true;
			}
		}
		return false;
	}

	/**
	 * Search all the added content of the edits for content that closely matches
	 * the given content of a line ... return anything that meets the target threshold
	 */
	findEditsWithSimilarAddedContent (content) {
		const edits = this.edits;
		const addedContents = this.getAddedContentsFromEdits();
		const matches = StringSimilarity.findBestMatch(content, addedContents).ratings;
		const matchingEdits = matches
			.filter(match => match.rating >= EDIT_SIMILARITY_THRESHOLD)
			.sort(sortRatings)
			.map(match => match.target)
			.map(matchingContent => {
				const index = addedContents.indexOf(matchingContent);
				return edits[index];
			});
		return matchingEdits;
	}

	/**
	 * Returns an array where each element is the whole content added (concatenation
	 * of added lines) by an edit. The order of elements in this array matches
	 * the order of elements in the edits array, so the index of a content is the
	 * same as the index of its respective edit.
	 */
	getAddedContentsFromEdits () {
		if (!this.editsAddedContent) {
			const editsAddedContent = (this.editsAddedContent = []);
			const edits = this.edits;

			for (const edit of edits) {
				editsAddedContent.push((edit.addedContent = edit.adds.join('')));
			}
		}

		return this.editsAddedContent;
	}

	/**
	 * Given a set of lines, find the best match within those lines to the given
	 * content ... return the index into the lines array passed in
	 */
	getBestMatchingLineIndex (content, lines) {
		const bestMatch = StringSimilarity.findBestMatch(content, lines).bestMatch;
		if (bestMatch.rating < LINE_SIMILARITY_THRESHOLD) {
			return -1;
		}
		const matchingContent = bestMatch.target;
		const index = lines.indexOf(matchingContent);
		return index;
	}

	/**
	 * Turn our array of marker data back into a location structure, like:
	 * {
	 *    <markerId>: <location>,
	 *    <markerId>: <location>,
	 *    ...
	 * }
	 *
	 * This is what gets stored to the database and returned to the client.
	 */
	generateOutputMarkers (callback) {
		this.outputMarkerLocations = {};
		for (let i = 0; i < this.markersData.length; i++) {
			let markerData = this.markersData[i];
			this.outputMarkerLocations[markerData.markerId] = [
				markerData.lineStartNew,
				markerData.colStartNew,
				markerData.lineEndNew,
				markerData.colEndNew
			];
			if (Object.keys(markerData.info).length > 0) {
				this.outputMarkerLocations[markerData.markerId].push(markerData.info);
			}
		}
		process.nextTick(callback);
	}
}

module.exports = MarkerMapper;
