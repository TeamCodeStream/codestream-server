'use strict';

import React from 'react';
import PropTypes from 'prop-types';

const AccordianCard = ({ accordionId, id, header, body }) => {
	return (
		<div className="card bg-dark">
			<div className="card-head" id={id}>
				<h5
					className="mb-0"
					data-toggle="collapse"
					data-target={`#${id}Collapse`}
					aria-expanded="false"
					aria-controls={`${id}Collapse`}
				>
					{header}
				</h5>
			</div>
			<div id={`${id}Collapse`} className="collapse show" aria-labelledby={id} data-parent={`#${accordionId}`}>
				<div className="card-body">{body}</div>
			</div>
		</div>
	);
};

AccordianCard.propTypes = {
	accordionId: PropTypes.string.isRequired,
	id: PropTypes.string.isRequired,
	header: PropTypes.string.isRequired,
	body: PropTypes.string.isRequired,
};

// AccordianCard.defaultProps = {
// 	message: 'you need to set the Header',
// };

class AccordionArrows extends React.Component {
	render() {
		const p = {
			accordionId: 'myAccordian',
			cards: [
				{
					id: 'cardOne',
					header: 'Collapsible Group Item #1',
					body:
						"1. Anim pariatur cliche reprehenderit, enim eiusmod high life accusamus terry richardson ad squid. 3 wolf moon officia aute, non cupidatat skateboard dolor brunch. Food truck quinoa nesciunt laborum eiusmod. Brunch 3 wolf moon tempor, sunt aliqua put a bird on it squid single-origin coffee nulla assumenda shoreditch et. Nihil anim keffiyeh helvetica, craft beer labore wes anderson cred nesciunt sapiente ea proident. Ad vegan excepteur butcher vice lomo. Leggings occaecat craft beer farm-to-table, raw denim aesthetic synth nesciunt you probably haven't heard of them accusamus labore sustainable VHS.",
				},
			],
		};

		return (
			<div className="AccordionArrows container-fluid bg-secondary">
				<div className="accordion" id={p.accordionId}>
					<AccordianCard accordionId={p.accordionId} id={p.cards[0].id} header={p.cards[0].header} body={p.cards[0].body} />
					{/* <div className="card bg-dark">
						<div className="card-head" id={p.cards[0].id}>
							<h5
								className="mb-0"
								data-toggle="collapse"
								data-target={`#${p.cards[0].id}Collapse`}
								aria-expanded="false"
								aria-controls={`${p.cards[0].id}Collapse`}
							>
								{p.cards[0].header}
							</h5>
						</div>

						<div id={`${p.cards[0].id}Collapse`} className="collapse show" aria-labelledby={p.cards[0].id} data-parent={`#${p.accordionId}`}>
							<div className="card-body">{p.cards[0].body}</div>
						</div>
					</div> */}

					<div className="card bg-dark">
						<div className="card-head" id="headingTwo">
							<h5 className="mb-0 collapsed" data-toggle="collapse" data-target="#collapseTwo" aria-expanded="false" aria-controls="collapseTwo">
								Collapsible Group Item #2
							</h5>
						</div>
						<div id="collapseTwo" className="collapse" aria-labelledby="headingTwo" data-parent={`#${p.accordionId}`}>
							<div className="card-body">
								2. Anim pariatur cliche reprehenderit, enim eiusmod high life accusamus terry richardson ad squid. 3 wolf moon officia aute, non
								cupidatat skateboard dolor brunch. Food truck quinoa nesciunt laborum eiusmod. Brunch 3 wolf moon tempor, sunt aliqua put a bird
								on it squid single-origin coffee nulla assumenda shoreditch et. Nihil anim keffiyeh helvetica, craft beer labore wes anderson
								cred nesciunt sapiente ea proident. Ad vegan excepteur butcher vice lomo. Leggings occaecat craft beer farm-to-table, raw denim
								aesthetic synth nesciunt you probably haven't heard of them accusamus labore sustainable VHS.
							</div>
						</div>
					</div>
					<div className="card bg-dark">
						<div className="card-head" id="headingThree">
							<h5
								className="mb-0 collapsed"
								data-toggle="collapse"
								data-target="#collapseThree"
								aria-expanded="false"
								aria-controls="collapseThree"
							>
								Collapsible Group Item #3
							</h5>
						</div>
						<div id="collapseThree" className="collapse" aria-labelledby="headingThree" data-parent={`#${p.accordionId}`}>
							<div className="card-body">
								3. Anim pariatur cliche reprehenderit, enim eiusmod high life accusamus terry richardson ad squid. 3 wolf moon officia aute, non
								cupidatat skateboard dolor brunch. Food truck quinoa nesciunt laborum eiusmod. Brunch 3 wolf moon tempor, sunt aliqua put a bird
								on it squid single-origin coffee nulla assumenda shoreditch et. Nihil anim keffiyeh helvetica, craft beer labore wes anderson
								cred nesciunt sapiente ea proident. Ad vegan excepteur butcher vice lomo. Leggings occaecat craft beer farm-to-table, raw denim
								aesthetic synth nesciunt you probably haven't heard of them accusamus labore sustainable VHS.
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	}
}

// Integrations.propTypes = {
// 	config: PropTypes.object.isRequired,
// 	support: PropTypes.object.isRequired
// };

export default AccordionArrows;
