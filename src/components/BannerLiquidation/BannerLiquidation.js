import React, { FC } from 'react';
//import { connect, ConnectedProps, Provider } from 'react-redux';
//import { getDebtStatusData } from '../../ducks/debtStatus';
//import configureMockStore from "redux-mock-store";

//const mockStore = configureMockStore();
//const store = mockStore({});
import styled from 'styled-components';

const mapStateToProps = (state) => ({
    //debtStatus: getDebtStatusData(state),
});

//const connector = connect(mapStateToProps, null);
//type PropsFromRedux = ConnectedProps < typeof connector > ;

const Banner = ({ debtStatus }) => {
    //if (!debtStatus) return null;
    //const { liquidationDeadline, liquidationDelay } = debtStatus;

   // if (!liquidationDeadline) return null;
	console.log(debtStatus)
    return (
			<ContainerBanner>
				<StyledPMedium>
					Attention: your staked OKS may be liquidated
					if you don 't bring your collateralization ratio above the
					liquidation ratio within {  604800 / 3600 }
					{ ' ' }hours. {/*Click { ' ' } <Link href = "" target = "_blank" >
					here </Link>{' '}
					for more info. */}
				</StyledPMedium> 
			</ContainerBanner>

    );
};

const Link = styled.a `
	text-decoration: underline;
	color: white;
`;

const ContainerBanner = styled.div `
	display: flex;
	justify-content: center;
	align-items: center;
	padding: 2px;
	width: 100%;
	background: ${props => props.theme.colorStyles.brandRed};
	color: white;
	cursor: pointer;
`;
const StyledPMedium = styled.p `
	font-size: 14px;
	line-height: 16px;
	color: white;
	text-transform: uppercase;
	margin-right: 4px;
`;

export default Banner;