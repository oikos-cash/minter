/* eslint-disable */
import { addSeconds } from 'date-fns';
import snxJSConnector from '../../helpers/snxJSConnector';
import {fromWei, toWei} from 'web3-utils'
import { bytesFormatter, parseBytes32String, toBigNumber, bigNumberFormatter } from '../../helpers/formatters';

const getBalances = async walletAddress => {
	try {
		const result = await Promise.all([
			snxJSConnector.snxJS.Oikos.collateral(walletAddress),
			snxJSConnector.snxJS.oUSD.balanceOf(walletAddress),
			snxJSConnector.provider.getBalance(walletAddress),
		]);

		
		const [oks, ousd, bnb] = result.map(bigNumberFormatter);
		return { oks, ousd, bnb };
	} catch (e) {
		console.log(e);
	}
};

const convertFromSynth = (fromSynthRate, toSynthRate) => {
	return fromSynthRate * (1 / toSynthRate);
};

// exported for tests
export const getOusdInUsd = async () => {
	const { uniswapV2Contract } = snxJSConnector;

	let oBNBPrice = await snxJSConnector.snxJS.ExchangeRates.ratesForCurrencies(
		['oBNB'].map(bytesFormatter)
	);
	oBNBPrice = fromWei(`${oBNBPrice}`)

	const [ reserves ] = await Promise.all([
		uniswapV2Contract.getReserves(),
	]) 
	let bnb =  fromWei(`${reserves[1]}`)
	let bnbReserveUSDValue = bnb * oBNBPrice
	let price = bnbReserveUSDValue / fromWei(`${reserves[0]}`)
	//console.log(`x is ${bnbReserveUSDValue} y ${fromWei(`${reserves[0]}`)}`)

	return price.toFixed(5)
};

export const oksToUSD = async () => {
	const {  uniswapOKSContract } = snxJSConnector;

	let oBNBPrice = await snxJSConnector.snxJS.ExchangeRates.ratesForCurrencies(
		['oBNB'].map(bytesFormatter)
	);
	oBNBPrice =  fromWei(`${oBNBPrice}`)

	const [ reserves ] = await Promise.all([
		uniswapOKSContract.getReserves(),
	]) 
	let bnb = fromWei(`${reserves[1]}`)
	let bnbReserveUSDValue = bnb * oBNBPrice
	let price = bnbReserveUSDValue / fromWei(`${reserves[0]}`)

	return price
};

const getSETHtoETH = async () => {
	return 1;
	const sBNBAddress = snxJSConnector.snxJS.oBNB.contract.address;
	const query = `query {
		exchanges(where: {tokenAddress:"${sBNBAddress}"}) {
			price
		}
	}`;
	const response = await fetch('https://api.thegraph.com/subgraphs/name/graphprotocol/uniswap', {
		method: 'POST',
		body: JSON.stringify({ query, variables: null }),
	}).then(x => x.json());
	return (
		response &&
		response.data &&
		response.data.exchanges &&
		response.data.exchanges[0] &&
		1 / response.data.exchanges[0].price
	);
};

const getPrices = async () => {
	try {
		const synthsP = snxJSConnector.snxJS.ExchangeRates.ratesForCurrencies(
			['OKS', /* 'oUSD',*/ 'oBNB'].map(bytesFormatter)
		);
		const ousdInUsd = await getOusdInUsd(/*
			{
				ousd,
				obnb,
			},
			sethToEthRate*/
		);		
		const sethToEthRateP = getSETHtoETH();
		let [synths, sethToEthRate] = await Promise.all([synthsP, sethToEthRateP]);
		let arrCopy = [...synths]

		await oksToUSD()
		
		arrCopy[0] = synths[0];
		arrCopy[1] = toBigNumber(ousdInUsd);
		arrCopy[2] = synths[1];
		synths = arrCopy;

		const [oks, ousd, obnb] = synths.map(bigNumberFormatter);

		return { oks, ousd: ousdInUsd, bnb: obnb };
	} catch (e) {
		console.log(e);
	}
};
const getRewards = async walletAddress => {
	try {
		const [feesAreClaimable, currentFeePeriod, feePeriodDuration] = await Promise.all([
			snxJSConnector.snxJS.FeePool.isFeesClaimable(walletAddress),
			snxJSConnector.snxJS.FeePool.recentFeePeriods(0),
			snxJSConnector.snxJS.FeePool.feePeriodDuration(),
		]);

		const currentPeriodStart =
			currentFeePeriod && currentFeePeriod.startTime
				? new Date(parseInt(currentFeePeriod.startTime * 1000))
				: null;
		const currentPeriodEnd =
			currentPeriodStart && feePeriodDuration
				? addSeconds(currentPeriodStart, feePeriodDuration)
				: null;
		return { feesAreClaimable, currentPeriodEnd };
	} catch (e) {
		console.log(e);
	}
};

const getDebt = async walletAddress => {
	try {
		const result = await Promise.all([
			snxJSConnector.snxJS.OikosState.issuanceRatio(),
			snxJSConnector.snxJS.Oikos.collateralisationRatio(walletAddress),
			snxJSConnector.snxJS.Oikos.transferableOikos(walletAddress),
			snxJSConnector.snxJS.Oikos.debtBalanceOf(walletAddress, bytesFormatter('oUSD')),
		]);
		const [targetCRatio, currentCRatio, transferable, debtBalance] = result.map(bigNumberFormatter);
		return {
			targetCRatio,
			currentCRatio,
			transferable,
			debtBalance,
		};
	} catch (e) {
		console.log(e);
	}
};

const getEscrow = async walletAddress => {
	try {
		const results = await Promise.all([
			snxJSConnector.snxJS.RewardEscrow.totalEscrowedAccountBalance(walletAddress),
			snxJSConnector.snxJS.OikosEscrow.balanceOf(walletAddress),
		]);
		const [reward, tokenSale] = results.map(bigNumberFormatter);
		return {
			reward,
			tokenSale,
		};
	} catch (e) {
		console.log(e);
	}
};

const getSynths = async walletAddress => {
	try {
		const synths = snxJSConnector.synths.filter(({ asset }) => asset).map(({ name }) => name);
		//.filter((synth) => {
		//	return synth !== "sBTT" && synth !== "iBTT"
		//});
		//console.log({ synths });

		const result = await Promise.all(
			synths.map(async synth => {
				try {
					return await snxJSConnector.snxJS[synth].balanceOf(walletAddress);
				} catch (err) {
					throw new Error(`error fetching balance of ${synth}: ${err}`);
				}
			})
		);

		//console.log({ result });
		const balances = await Promise.all(
			result.map((balance, i) => {
				return snxJSConnector.snxJS.ExchangeRates.effectiveValue(
					bytesFormatter(synths[i]),
					balance,
					bytesFormatter('oUSD')
				);
			})
		);
		//console.log({ balances });
		let totalBalance = 0;
		const formattedBalances = balances.map((balance, i) => {
			const formattedBalance = bigNumberFormatter(balance);
			totalBalance += formattedBalance;
			return {
				synth: synths[i],
				balance: formattedBalance,
			};
		});
		return {
			balances: formattedBalances,
			total: totalBalance,
		};
	} catch (e) {
		console.log(e);
	}
};

export const fetchData = async walletAddress => {
	const [balances, prices, rewardData, debtData, escrowData, synthData] = await Promise.all([
		getBalances(walletAddress),
		getPrices(),
		getRewards(walletAddress),
		getDebt(walletAddress),
		getEscrow(walletAddress),
		getSynths(walletAddress),
	]).catch(e => console.log(e));
	//console.log(synthData);
	return {
		balances,
		prices,
		rewardData,
		debtData,
		escrowData,
		synthData,
	};
};
