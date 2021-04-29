import React, { useState, useEffect, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import UniPool from './UniPool';
import CurvePool from './CurvePool';

import UniPoolV2 from './UniPoolV2';
import UniPoolDRV from './UniPoolDRV';

import { H1, H2, PageTitle } from '../../../components/Typography';
import PageContainer from '../../../components/PageContainer';

import snxJSConnector from '../../../helpers/snxJSConnector';
import { Store } from '../../../store';

import { bytesFormatter, parseBytes32String } from '../../../helpers/formatters';
import { parseUnits, formatUnits } from "@ethersproject/units"
import { BigNumber } from "@ethersproject/bignumber"

const bigNumberFormatter = value => Number(snxJSConnector.utils.formatEther(value));

const POOLS = [
	{
		title: 'lpRewards.actions.unipool.title',
		name: 'pancake',
	},
	{ title: 'lpRewards.actions.curvepool.title', name: 'derive' },
];

const POOLS2 = [
	{
		title: 'lpRewards.actions.unipoolV2.title',
		name: 'pancakeV2',
	},
	{ title: 'lpRewards.actions.derivepool.title', name: 'pancakeDRV' },	
];

const formatBNToString= (bn, nativePrecison, decimalPlaces) => {
 
	const fullPrecision = formatUnits(bn, nativePrecison)
	const decimalIdx = fullPrecision.indexOf(".")
	return decimalPlaces === undefined || decimalIdx === -1
	  ? fullPrecision
	  : fullPrecision.slice(
		  0,
		  decimalIdx + (decimalPlaces > 0 ? decimalPlaces + 1 : 0), // don't include decimal point if places = 0
		)
  }

const LPRewards = () => {
	const { t } = useTranslation();
	const [currentPool, setCurrentPool] = useState(null);
	const goBack = () => setCurrentPool(null);

	const getPoolComponent = poolName => {
		switch (poolName) {
			case 'pancake':
				return <UniPool goBack={goBack} />;
			case 'derive':
				return <CurvePool goBack={goBack} />;
			case 'pancakeV2':
				return <UniPoolV2 goBack={goBack} />;
			case 'pancakeDRV':
				return <UniPoolDRV goBack={goBack} />;				
		}
	};

	const { curveLPTokenContract, deriveOUSDContract } = snxJSConnector;
	const {
		state: {
			wallet: { currentWallet },
		},
		dispatch,
	} = useContext(Store);

	//const [lpTokenBalance, setLPTokenBalance] = useState(0)
	//const [totalLpTokenBalance, setTotalLpTokenBalance] = useState(0)
	const [oikosAPR, setOikosAPR] = useState(0)

	useEffect(() => {
		async function getData() {
			const [userLpTokenBalance, totalLpTokenBalance] = await Promise.all([
				curveLPTokenContract.balanceOf(currentWallet || "0x0"),
				curveLPTokenContract.totalSupply(),
		])
		const synthsP = snxJSConnector.snxJS.ExchangeRates.ratesForCurrencies(
			['OKS', 'oUSD', 'oBNB'].map(bytesFormatter)
		);
		const [synths] = await Promise.all([synthsP]);
		const [oks, ousd, sbnb] = synths.map(bigNumberFormatter);

	     // (weeksPerYear * OIKOSPerWeek * OIKOSPrice) / (LPTokenPrice * totalLPTokenBalance)
		 const oikosAPRNumerator = BigNumber.from((13 * 240000) + 5000000)
		 .mul(BigNumber.from(10).pow(18))
		 .mul(parseUnits(String(oks || 0), 18))

		 const oikosAPRDenominator = totalLpTokenBalance
		 .mul(
		   parseUnits(
			 String(1 || 0),
			 6,
		   ),
		 )
		 .div(1e6)
  
 
	   const _oikosApr = totalLpTokenBalance.isZero()
		 ? oikosAPRNumerator
		 : oikosAPRNumerator.div(oikosAPRDenominator)
		 
 
		setOikosAPR((Number(formatBNToString(_oikosApr)) * 100).toFixed(2))
		//setLPTokenBalance(userLpTokenBalance)
		//setTotalLpTokenBalance(totalLpTokenBalance)
		}
	
		getData()
	  }, [])


	return (
		<PageContainer>
			{currentPool ? (
				getPoolComponent(currentPool)
			) : (
				<>
					<PageTitle>{t('lpRewards.intro.title')}</PageTitle>
					<ButtonRow>
						{POOLS.map(({ title, name }, idx) => {
							let apr, subtitle, link
							if (name == "derive") {
								apr = oikosAPR
								subtitle = "derive.fi"
								link = subtitle 
							} else if (name == "pancake") {
								apr = 0
								subtitle = "(Discountinued)"
								link = "v1exchange.pancakeswap.finance/#/remove/BNB/0x6BF2Be9468314281cD28A94c35f967caFd388325"
							}
							
							return (
								<Button key={idx} onClick={() => setCurrentPool(name)}>
									<ButtonContainer>
										<ActionImage src={`/images/${name}.png`} big />
										<H1>{t(title)}</H1>
										<H2><a href={`https://${link}`} target="_blank" rel="noreferrer">{subtitle}</a></H2>
										<H2>APR: {apr} %</H2>
									</ButtonContainer>
								</Button>
							);
						})}
					</ButtonRow>
					<br />
					<ButtonRow>
						{POOLS2.map(({ title, name }, idx) => {
							return (
								<Button key={idx} onClick={() => setCurrentPool(name)}>
									<ButtonContainer>
										<ActionImage src={`/images/${name}.png`} big />
										<H1>{t(title)}</H1>
									</ButtonContainer>
								</Button>
							);
						})}
					</ButtonRow>					
				</>
			)}
		</PageContainer>
	);
};

const Button = styled.button`
	flex: 1;
	cursor: pointer;
	height: 352px;
	max-width: 352px;
	background-color: ${props => props.theme.colorStyles.panelButton};
	border: 1px solid ${props => props.theme.colorStyles.borders};
	border-radius: 5px;
	box-shadow: 0px 5px 10px 5px ${props => props.theme.colorStyles.shadow1};
	transition: transform ease-in 0.2s;
	&:hover {
		background-color: ${props => props.theme.colorStyles.panelButtonHover};
		box-shadow: 0px 5px 10px 8px ${props => props.theme.colorStyles.shadow1};
		transform: translateY(-2px);
	}
	&:first-child {
		margin-right: 20px;
	}
`;

const ButtonContainer = styled.div`
	padding: 10px;
	margin: 0 auto;
`;

const ButtonRow = styled.div`
	display: flex;
	justify-content: space-between;
	margin: ${props => (props.margin ? props.margin : 0)};
`;

const ActionImage = styled.img`
	height: ${props => (props.big ? '64px' : '48px')};
	width: ${props => (props.big ? '64px' : '48px')};
`;

export default LPRewards;
