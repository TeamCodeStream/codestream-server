'use strict';

import React from 'react';
import PropTypes from 'prop-types';

// Build cell element for 3-way standard toggle property; on (clickable), off, disabled
// const icon3Option = (specialProp, row, onImage, offImage, notClickableImage=null) => {
// 	if (row[specialProp].on) {
// 		return (
// 			<img
// 				className="icon-image"
// 				src={onImage}
// 				onClick={row[specialProp].onClick?.whenOn}
// 				data-toggle="tooltip"
// 				title={row[specialProp].tooltip?.whenOn}
// 				data-placement="bottom"
// 			/>
// 		);
// 	} else if (row[specialProp].on !== null) {
// 		return (
// 			<img
// 				className="icon-image"
// 				src={offImage}
// 				data-toggle="tooltip"
// 				title={row[specialProp].tooltip?.whenOff}
// 				onClick={row[specialProp].onClick?.whenOff}
// 				data-placement="bottom"
// 			/>
// 		);
// 	} else if (notClickableImage) {
// 		return (
// 			<img className="icon-image" src={notClickableImage} data-toggle="tooltip" title={row[specialProp].tooltip.whenDisabled} data-placement="bottom" />
// 		);
// 	}
// 	return <></>;
// };

class Icon3Option extends React.Component {
	// componentWillUnmount() {
	// 	console.log('hiding tooltip');
	// 	React.createRef().tooltip('hide');
	// }

	render() {
		const { specialProp, row, onImage, offImage, notClickableImage } = this.props;
		if (row[specialProp].on) {
			return (
				<img
					className="icon-image"
					src={onImage}
					onClick={row[specialProp].onClick?.whenOn}
					data-toggle="tooltip"
					data-placement="bottom"
					title={row[specialProp].tooltip?.whenOn}
				/>
			);
		} else if (row[specialProp].on !== null) {
			return (
				<img
					className="icon-image"
					src={offImage}
					data-toggle="tooltip"
					title={row[specialProp].tooltip?.whenOff}
					data-placement="bottom"
					onClick={row[specialProp].onClick?.whenOff}
				/>
			);
		} else if (notClickableImage) {
			return (
				<img
					className="icon-image"
					src={notClickableImage}
					data-toggle="tooltip"
					data-placement="bottom"
					title={row[specialProp].tooltip.whenDisabled}
				/>
			);
		}
		return <></>;
	};
};

// Icon3Option.propTypes = {
// 	specialProp: PropTypes.string.isRequired,
// 	rows: PropTypes.array.isRequired,
// 	columnOrder: PropTypes.array.isRequired,
// };


// designated properties for standard operations (delete, load, activate, ...)
const specialCell = (_propName, row) => {
	const propName = _propName.slice(1);
	switch (propName) {
		case 'deletable':
			return (
				<Icon3Option
					specialProp="deletable"
					row={row}
					onImage="/s/fa/svgs/solid/trash.svg.on-dark.png"
					offImage="/s/fa/svgs/solid/trash.svg.grey2-8e8e8e.png"
				/>
			);
			// return icon3Option('deletable', row, '/s/fa/svgs/solid/trash.svg.on-dark.png', '/s/fa/svgs/solid/trash.svg.grey2-8e8e8e.png');
		case 'loadable':
			return (
				<Icon3Option
					specialProp="loadable"
					row={row}
					onImage="/s/fa/svgs/solid/file-download.svg.on-dark.png"
					offImage="/s/fa/svgs/solid/file-download.svg.grey2-8e8e8e.png"
				/>
			);
			// return icon3Option('loadable', row, '/s/fa/svgs/solid/file-download.svg.on-dark.png', '/s/fa/svgs/solid/file-download.svg.grey2-8e8e8e.png');
			return;
		case 'active':
			return (
				<Icon3Option
					specialProp="active"
					row={row}
					onImage="/s/fa/svgs/solid/toggle-on.svg.green.png"
					offImage="/s/fa/svgs/solid/toggle-off.svg.on-dark.png"
					notClickableImage="/s/fa/svgs/solid/toggle-off.svg.grey2-8e8e8e.png"
				/>
			);
			// return icon3Option(
			// 	'active',
			// 	row,
			// 	'/s/fa/svgs/solid/toggle-on.svg.green.png',
			// 	'/s/fa/svgs/solid/toggle-off.svg.on-dark.png',
			// 	'/s/fa/svgs/solid/toggle-off.svg.grey2-8e8e8e.png'
			// );
		default:
			return <></>;
	};
};

const standardCell = (propName, row) => {
	if (row.tooltip[propName]) {
		return (
			<span data-toggle="tooltip" data-placement="bottom" title={row.tooltip[propName]}>
				{row[propName]}
			</span>
		);
	}
	return <span>{row[propName]}</span>;
};

class Table extends React.Component {
	// componentDidUpdate() {
	// 	React.ReactTooltip.rebuild();
	// }

	render() {
		const { columnOrder, rows, columnTitles } = this.props;
		return (
			<div className="container-fluid d-flex justify-content-center">
				<div className="row">
					<table className="table table-bordered table-dark table-striped table-hover">
						<thead className="thead-light text-center">
							<tr>
								{columnOrder.map((propName) => (
									<th key={propName}>{columnTitles[propName]}</th>
								))}
							</tr>
						</thead>
						<tbody>
							{rows.map((row) => (
								<tr key={row._id}>
									{columnOrder.map((propName) => (
										<td key={propName}>{propName.startsWith('_') ? specialCell(propName, row) : standardCell(propName, row)}</td>
									))}
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
		);
	}
};

Table.propTypes = {
	columnTitles: PropTypes.object.isRequired,
	rows: PropTypes.array.isRequired,
	columnOrder: PropTypes.array.isRequired,
};

// Table.defaultProps = {
// 	columnOrder: ['col1', 'col2'], // ordered list of property names (left to right)
// 	rows: [
// 		{
// 			_id: '1234512341234',
// 			col1: 'data 1',
// 			col2: 10,
// 		},
// 		{
// 			_id: 'ABCDEFGJDHDDW',
// 			col1: 'data 2',
// 			col2: 20,
// 		},
// 	],
// 	columnTitles: {
// 		col1: 'Col Title 1',
// 		col2: 'Col Title 2',
// 	}
// };

export default Table;
