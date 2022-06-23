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
import { getFixedT } from 'i18next';
import { ethers } from "ethers";
import { unipool, uniswap, curvepool, curveLPToken, synthSummary, uniswapV2, unipoolV2, unipoolDRV, uniswapDRV, swapFlashLoan} from '../../../helpers/contracts';

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

	const { curveLPTokenContract, deriveOUSDContract, uniswapV2Contract, uniswapDRVContract, unipoolV2Contract, signer } = snxJSConnector;
	const {
		state: {
			wallet: { currentWallet },
		},
		dispatch,
	} = useContext(Store);

	//const [lpTokenBalance, setLPTokenBalance] = useState(0)
	//const [totalLpTokenBalance, setTotalLpTokenBalance] = useState(0)
	const [oikosAPR, setOikosAPR] = useState(0)
	const [oikosAPRV2, setOikosAPRV2] = useState(0)
	const [oikosAPRDRV, setOikosAPRVDRV] = useState(0)



	useEffect(() => {

		async function fairTokenPricing (contract) {
			 
			const sqrt = (x) => {
				const ONE = BigNumber.from(1);
				const TWO = BigNumber.from(2);
	
				let z = x.add(ONE).div(TWO);
				let y = x;

				while (z.sub(y).isNegative()) {
					y = z;
					z = x.div(z).add(z).div(TWO);
				}
				return y;
			}
	
			const [token0, token1, totalSupply, reserves ] = await Promise.all([
				contract.token0,
				contract.token1,
				contract.totalSupply(),
				contract.getReserves(),
			])
	
			let r0 = reserves[0]
			let r1 = reserves[1]
	
			let sqrtK = sqrt(r0.mul(r1)).div(totalSupply)
	
			console.log(new ethers.Contract(token0, curveLPToken.abi, signer))

			let px0 = await fairTokenPricing(new ethers.Contract(token0, curveLPToken.abi, signer))
			let px1 = await fairTokenPricing(new ethers.Contract(token1, curveLPToken.abi, signer))


			let divisorBN = (2**56)
			return sqrtK.mul(2).mul(sqrt(px0)).div(divisorBN).mul(sqrt(px1)).div(divisorBN)
		}


		async function getData() {
			const [userLpTokenBalance, totalLpTokenBalance, totalV2LpTokenBalance, reserves, totalDRVLpTokenBalance] = await Promise.all([
				curveLPTokenContract.balanceOf(currentWallet || "0x0"),
				curveLPTokenContract.totalSupply(),
				unipoolV2Contract.totalSupply(),
				uniswapDRVContract.getReserves(),
				uniswapDRVContract.totalSupply(),

		])
		
		const synthsP = snxJSConnector.snxJS.ExchangeRates.ratesForCurrencies(
			['OKS', 'oUSD', 'BNB'].map(bytesFormatter)
		);
		const [synths] = await Promise.all([synthsP]);
		let [oks, ousd, obnb] = synths.map(bigNumberFormatter);

		
		console.log(`${reserves[0]} * ${reserves[1]} * ${oks}`);

		let drvPriceUsd = (reserves[0] / reserves[1]) * oks;
		console.log(`Price of DRV in USD is ${drvPriceUsd}`);
		oks = oks * 1e18;
		obnb = obnb * 1e18;
		ousd = ousd * 1e18;
		drvPriceUsd = drvPriceUsd * 1e18;
		// (weeksPerYear * OIKOSPerWeek * OIKOSPrice) / (LPTokenPrice * totalLPTokenBalance)
		let oikosAPRNumerator = BigNumber.from((52 * 240000))//.mul(BigNumber.from(10).pow(18)) 
		.mul(parseUnits(String(oks || 0), 18))
		
		const drvRewards = BigNumber.from((52 * 340000))//.mul(BigNumber.from(10).pow(18))
		.mul(parseUnits(String(drvPriceUsd || 0), 18))

		
		//console.log(`Summing ${oikosAPRNumerator} + ${drvRewards} factors ${oks} ${drvPriceUsd}`)
		oikosAPRNumerator = oikosAPRNumerator.add(drvRewards) 
		 

		const oikosAPRDenominator = totalLpTokenBalance
		 .mul(
		   parseUnits(
			 String(ousd || 0),
			 6,
		   ),
		 )
		 .div(1e6)

		 console.log(`${obnb}`)
		
		const oikosAPRNumeratorV2 = BigNumber.from((13 * 140000) + 3000000)
		 //.mul(BigNumber.from(10).pow(18))
		 .mul(parseUnits(String(oks || 0), 18))



		//console.log(`${oikosAPRNumeratorV2} -  ${totalV2LpTokenBalance} - ${ousd} - ${obnb}` )

		const oikosAPRDenominatorV2 = totalV2LpTokenBalance
		 .mul(
		   parseUnits(
			 String(obnb || 0),
			 6,
		   ),
		 )
		 .div(1e6)
		 
		// console.log( `${oikosAPRNumeratorV2} / ${oikosAPRDenominatorV2}`)

		const oikosAPRNumeratorDRV = BigNumber.from((13 * 100000) )
		 //.mul(BigNumber.from(10).pow(18))
		 .mul(parseUnits(String(oks || 0), 18))


		const oikosAPRDenominatorDRV = totalDRVLpTokenBalance
		 .mul(
		   parseUnits(
			 String(drvPriceUsd || 0),
			 6,
		   ),
		 )
		 .div(1e6)

		 const _oikosApr = totalLpTokenBalance.isZero()
		 ? oikosAPRNumerator
		 : oikosAPRNumerator/ oikosAPRDenominator
 
	    //console.log(`Oikos APR is ${_oikosApr.toString()} oikosAPRNumerator ${oikosAPRNumerator} oikosAPRdenominator ${oikosAPRDenominator}` )
 
	
		const _oikosAprV2 = totalV2LpTokenBalance.isZero()
		 ? oikosAPRNumeratorV2
		 : oikosAPRNumeratorV2 /oikosAPRDenominatorV2

		const _oikosAprDRV = totalDRVLpTokenBalance.isZero()
		 ? oikosAPRNumeratorDRV
		 : oikosAPRNumeratorDRV / oikosAPRDenominatorDRV

		setOikosAPR((Number(_oikosApr) * 100).toFixed(2))
		setOikosAPRV2((Number(_oikosAprV2) * 100).toFixed(2))
		setOikosAPRVDRV((Number(_oikosAprDRV) * 100).toFixed(2))
		
		//setLPTokenBalance(userLpTokenBalance)
		//setTotalLpTokenBalance(totalLpTokenBalance)
		}
	
		getData()
		//fairTokenPricing(uniswapV2Contract)
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
							let apr, subtitle, link, opacity
							if (name == "derive") {
								apr = oikosAPR
								subtitle = "derive.fi"
								link = subtitle 
								opacity = {opacity:"1"}
							} else if (name == "pancake") {
								apr = 0
								subtitle = "(Ended)"
								link = "pancakeswap.finance/add/BNB/0x6BF2Be9468314281cD28A94c35f967caFd388325"
								opacity = {opacity:"0.5"}
							} 
							
							return (
								<Button key={idx} onClick={() => setCurrentPool(name)}
								disabled={ name == "pancake" ? true: false}
								style={opacity}
								>
								<ButtonContainer>
										<ActionImage src={`/images/${name}.png`} big />
										<H1>{t(title)}</H1>
										<H2><a href={`https://${link}`} target="_blank" rel="noreferrer">{subtitle}</a></H2>
										<H2>APR: <label style={{color:"green"}}> {apr} </label> %</H2>
									</ButtonContainer>	
								</Button>
							);
						})}
					</ButtonRow>
					<br />
					<ButtonRow>
						{POOLS2.map(({ title, name }, idx) => {
							let apr, subtitle, link, opacity
							if (name == "pancakeV2") {
								apr = oikosAPRV2
								subtitle = ""
								link = subtitle 
								opacity = {opacity:"1"}
							} else if (name == "pancakeDRV") {
								apr = oikosAPRDRV
								subtitle = "(Paused)"
								link = "pancakeswap.finance/remove/BNB/0x6BF2Be9468314281cD28A94c35f967caFd388325"
								opacity = {opacity:"0.5"}
							} 				
							console.log(`Pool name is ${name}`)			
							return (
								<Button key={idx} onClick={() => setCurrentPool(name)} 
								//disabled={name == "pancakeDRV" ? true: false}
									style={opacity}
								>
									<ButtonContainer>
										<ActionImage src={`/images/${name}.png`} big />
										<H1>{t(title)}</H1>
										<H2><a href={`https://${link}`} target="_blank" rel="noreferrer">{subtitle}</a></H2>
										<H2>APR: <label style={{color:"green"}}> {apr} </label> %</H2>
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
	a:visited { color: #9492C4 !important; }
	a:link { color: #9492C4 !important; }
	a:hover { color: #9492C4 !important; }
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
