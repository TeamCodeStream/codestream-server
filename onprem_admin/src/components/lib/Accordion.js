'use strict';

import React from 'react';
import PropTypes from 'prop-types';

const AccordionHeader = ({ header, status, value }) => {
	return (
		<span>
			{value && <span className={`ml-2 badge badge-${status}`}>{value}</span>}
			<span className="ml-2">{header}</span>
		</span>
	);
}

const AccordionCard = props => {
	return (
		<div className="card">
			<h5 id={props.id} className="card-head text-dark mb-0 collapsed" data-toggle="collapse" data-target={`#${props.id}Collapse`} aria-expanded="false" aria-controls={`${props.id}Collapse`}>
				<AccordionHeader header={props.header} value={props.badgeValue} status={props.badgeStatus} />
			</h5>
			<div id={`${props.id}Collapse`} className="card-body bg-dark collapse" aria-labelledby={props.id} data-parent={`#${props.accordionId}`}>
				{props.children}
			</div>
		</div>
	);
};

AccordionCard.propTypes = {
	accordionId: PropTypes.string.isRequired,
	id: PropTypes.string.isRequired,
	header: PropTypes.string.isRequired,
	badgeValue: PropTypes.string,
	badgeStatus: PropTypes.string,
};

// AccordionCard.defaultProps = {
// 	badgeValue: "OK",
// 	badgeStatus: "dark",
// };

class Accordion extends React.Component {
	render() {
		return (
			<div className="Accordion container-fluid bg-secondary">
				<div className="accordion" id={this.props.accordionId}>
					{this.props.cards.map((c) => (
						<AccordionCard
							key={c.id}
							accordionId={this.props.accordionId}
							id={c.id}
							header={c.header}
							badgeValue={this.props.statuses?.[c.id]?.value}
							badgeStatus={this.props.statuses?.[c.id]?.status}
						>
							<span>{React.cloneElement(c.bodyComponent, c.bodyComponentProps)}</span>
						</AccordionCard>
					))}
				</div>
			</div>
		);
	}
}

Accordion.propTypes = {
	accordionId: PropTypes.string.isRequired,
	cards: PropTypes.array.isRequired,
	statuses: PropTypes.object,
};

// this is more for documentation...
Accordion.defaultProps = {
	cards: [
		{
			id: 'card-id-not-displayed',
			header: 'card header',
			bodyComponent: (<></>),		// component to render the body of the card
			bodyComponentProps: {},
		}
	]
};

const statusesExample = {
	__cardId__: {
		value: 'badge text',	// any string
		status: 'bootstrap status color',	// dark, info, warning, success, danger, ...
	}
};

export default Accordion;
