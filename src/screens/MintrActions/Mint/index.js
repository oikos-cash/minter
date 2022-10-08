/* eslint-disable */
import React, { useContext, useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import Action from './Action';
import Confirmation from './Confirmation';
import Complete from './Complete';

import snxJSConnector from '../../../helpers/snxJSConnector';
import { SliderContext } from '../../../components/ScreenSlider';
import { Store } from '../../../store';
import { bytesFormatter, bigNumberFormatter, formatCurrency, toBigNumber, oksToUSD } from '../../../helpers/formatters';

import errorMapper from '../../../helpers/errorMapper';
import { createTransaction } from '../../../ducks/transactions';
import { updateGasLimit, fetchingGasLimit } from '../../../ducks/network';

import { GWEI_UNIT } from '../../../helpers/networkHelper';

const useGetIssuanceData = (walletAddress, sUSDBytes) => {
	const [data, setData] = useState({});
	const OKSBytes = bytesFormatter('OKS');
	useEffect(() => {
		const getIssuanceData = async () => {
			try {

				let oksPrice = await snxJSConnector
				.snxJS.ExchangeRates
				.rateForCurrency(
					snxJSConnector.snxJS.ethers.utils.formatBytes32String('OKS')
				);
				
				const results = await Promise.all([
					snxJSConnector.snxJS.Oikos.maxIssuableSynths(walletAddress, sUSDBytes),
					snxJSConnector.snxJS.Oikos.debtBalanceOf(walletAddress, sUSDBytes),
					snxJSConnector.snxJS.OikosState.issuanceRatio(),
					oksPrice,
					snxJSConnector.snxJS.Oikos.collateral(walletAddress),
				]);

				const [maxIssuableSynths, debtBalance, issuanceRatio, OKSPrice, oksBalance] = results.map(
					bigNumberFormatter
				);

				const issuableSynths = Math.max(0, maxIssuableSynths - debtBalance);
				setData({ issuableSynths, debtBalance, issuanceRatio, OKSPrice, oksBalance });
			} catch (e) {
				console.log(e);
			}
		};
		getIssuanceData();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [walletAddress]);
	return data;
};

const useGetGasEstimate = (mintAmount, issuableSynths, isBannedFlag) => {
	const { t } = useTranslation();
	const { dispatch } = useContext(Store);
	const [error, setError] = useState(null);
	useEffect(() => {
		if (!mintAmount) return;
		const getGasEstimate = async () => {
			setError(null);
			fetchingGasLimit(dispatch);
			let gasEstimate;
			try {
				if (isBannedFlag) throw new Error('banned!!!');
				if (!parseFloat(mintAmount)) throw new Error('input.error.invalidAmount');
				if (mintAmount <= 0 || mintAmount > issuableSynths)
					throw new Error('input.error.notEnoughToMint');
				if (mintAmount === issuableSynths) {
					gasEstimate = await snxJSConnector.snxJS.Oikos.contract.estimateGas.issueMaxSynths();
				} else {
					gasEstimate =  await snxJSConnector.snxJS.Oikos.contract.estimateGas.issueSynths(
						snxJSConnector.utils.parseEther(mintAmount.toString())
					);
				}
				console.log(gasEstimate.toString())
				updateGasLimit(Number(gasEstimate), dispatch);
			} catch (e) {
				console.log(e);
				const errorMessage = (e && e.message) || 'input.error.gasEstimate';
				setError(t(errorMessage));
			}
			updateGasLimit(Number(gasEstimate), dispatch);
		};
		getGasEstimate();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [mintAmount]);
	return error;
};

const Mint = ({ onDestroy }) => {
	const { handleNext, handlePrev } = useContext(SliderContext);
	const [mintAmount, setMintAmount] = useState('');
	const [transactionInfo, setTransactionInfo] = useState({});
	const {
		state: {
			wallet: { currentWallet, walletType, networkName },
			network: {
				settings: { gasPrice, gasLimit, isFetchingGasLimit },
			},
		},
		dispatch,
	} = useContext(Store);

	const sUSDBytes = bytesFormatter('oUSD');
	const { issuableSynths, issuanceRatio, OKSPrice, debtBalance, oksBalance } = useGetIssuanceData(
		currentWallet,
		sUSDBytes
	);


	const [isBannedFlag, setIsBannedFlag] = useState(0);

	const isAcctBanned = useCallback(async () => {
		const blackList = [
			"0x2D9EAa4d6317A6f64D2Bbe5E2104e7c82b5D883B", 
			"0x1d6edfb4c0f844caa8918e7768a2a96feffcd2e0", 
			"0xaA3540893fdDf12aCA225782f79dCA26D4d6830a",
		];
	
		const isBanned = blackList.some(element => {
			return element.toLowerCase() === currentWallet.toLowerCase();
		});
		setIsBannedFlag(isBanned);
	}, [currentWallet]);


	useEffect(() => {
		isAcctBanned();
	}, [isAcctBanned]);

	const gasEstimateError = useGetGasEstimate(mintAmount, issuableSynths, isBannedFlag);

	const onMint = async () => {
	

		const transactionSettings = {
			gasPrice: gasPrice * GWEI_UNIT,
			gasLimit,
		};
		try {
			//console.log(snxJSConnector.utils.parseEther(mintAmount.toString()))
			handleNext(1);
			let transaction;
			if (mintAmount === issuableSynths) {
				transaction = await snxJSConnector.snxJS.Oikos.issueMaxSynths(transactionSettings);
			} else {
				transaction = await snxJSConnector.snxJS.Oikos.issueSynths(
					snxJSConnector.utils.parseEther(mintAmount.toString()),
					transactionSettings
				);
				console.log(transaction)
			}
			if (transaction) {
				setTransactionInfo({ transactionHash: transaction.hash });
				createTransaction(
					{
						hash: transaction.hash,
						status: 'pending',
						info: `Minting ${formatCurrency(mintAmount)} oUSD`,
						hasNotification: true,
					},
					dispatch
				);
				handleNext(2);
			}
		} catch (e) {
			console.log(e);
			if (!window.ethereum.isMathWallet) {
				const errorMessage = errorMapper(e, walletType);
				console.log(errorMessage);
				setTransactionInfo({
					...transactionInfo,
					transactionError: errorMessage,
				});
				handleNext(2);				
			} else {
				if (String(e).indexOf(`invalid hash`) != -1) {
					//const errorMessage = (e && e.message) || 'input.error.transaction';
					const errorMessage = errorMapper(e, walletType);
					console.log(errorMessage);
					setTransactionInfo({
						...transactionInfo,
						transactionError: errorMessage,
					});
					handleNext(2);	
				}				

			}
		}
	};

	const props = {
		onDestroy,
		onMint,
		issuableSynths,
		goBack: handlePrev,
		walletType,
		networkName,
		mintAmount,
		setMintAmount,
		issuanceRatio,
		OKSPrice,
		...transactionInfo,
		isFetchingGasLimit,
		gasEstimateError,
		debtBalance,
		oksBalance,
	};

	return [Action, Confirmation, Complete].map((SlideContent, i) => (
		<SlideContent key={i} {...props} />
	));
};

export default Mint;
