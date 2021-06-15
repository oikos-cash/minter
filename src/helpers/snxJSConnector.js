import { OikosJs } from '@oikos/oikos-js-bsc';
import { getEthereumNetwork, INFURA_JSON_RPC_URLS } from './networkHelper';
import { ethers } from 'ethers';
import { unipool, uniswap, curvepool, curveLPToken, synthSummary, uniswapV2, unipoolV2, unipoolDRV, uniswapDRV, uniswapOKS, swapFlashLoan, drvPool} from './contracts';

let snxJSConnector = {
	initialized: false,
	signers: OikosJs.signers,
	setContractSettings: function(contractSettings) {
		this.initialized = true;
		this.snxJS = new OikosJs(contractSettings);
		this.synths = this.snxJS.contractSettings.synths;
		this.signer = this.snxJS.contractSettings.signer;
		this.provider = this.snxJS.contractSettings.provider;
		this.utils = this.snxJS.utils;
		this.ethersUtils = this.snxJS.ethers.utils;
		if (this.signer) {
			this.uniswapContract = new ethers.Contract(uniswap.address, uniswap.abi, this.signer);
			this.unipoolContract = new ethers.Contract(unipool.address, unipool.abi, this.signer);
			this.curveLPTokenContract = new ethers.Contract(
				curveLPToken.address,
				curveLPToken.abi,
				this.signer
			);
			this.oldCurvepoolContract = new ethers.Contract(curvepool.oldAddress, curvepool.abi, this.signer);
			this.curvepoolContract = new ethers.Contract(curvepool.address, curvepool.abi, this.signer);
			this.uniswapV2Contract = new ethers.Contract(uniswapV2.address, uniswapV2.abi, this.signer);
			this.unipoolV2Contract = new ethers.Contract(unipoolV2.address, unipoolV2.abi, this.signer);
			this.uniswapV2Contract = new ethers.Contract(uniswapV2.address, uniswapV2.abi, this.signer);
			this.unipoolV2Contract = new ethers.Contract(unipoolV2.address, unipoolV2.abi, this.signer);									
			this.uniswapDRVContract = new ethers.Contract(uniswapDRV.address, uniswapDRV.abi, this.signer);
			this.unipoolDRVContract = new ethers.Contract(unipoolDRV.address, unipoolDRV.abi, this.signer);	
			this.deriveOUSDContract = new ethers.Contract(swapFlashLoan.address, swapFlashLoan.abi, this.signer);	
			this.uniswapOKSContract = new ethers.Contract(uniswapOKS.address, uniswapOKS.abi, this.signer);
			this.drvPoolContract 	= new ethers.Contract(drvPool.address, drvPool.abi, this.signer);	
		}
		/*this.synthSummaryUtilContract = new ethers.Contract(
			synthSummary.addresses[contractSettings.networkId],
			synthSummary.abi,
			this.provider
		);*/
	},
};

const connectToMetamask = async (networkId, networkName) => {
	try {
		// Otherwise we enable ethereum if needed (modern browsers)
		if (window.ethereum) {
			window.ethereum.autoRefreshOnNetworkChange = true;
			await window.ethereum.enable();
		}
		const accounts = await snxJSConnector.signer.getNextAddresses();
		if (accounts && accounts.length > 0) {
			return {
				currentWallet: accounts[0],
				walletType: 'Metamask',
				unlocked: true,
				networkId,
				networkName: networkName.toLowerCase(),
			};
		} else {
			return {
				walletType: 'Metamask',
				unlocked: false,
				unlockReason: 'MetamaskNoAccounts',
			};
		}
		// We updateWalletStatus with all the infos
	} catch (e) {
		console.log(e);
		return {
			walletType: 'Metamask',
			unlocked: false,
			unlockReason: 'ErrorWhileConnectingToMetamask',
			unlockMessage: e,
		};
	}
};

const connectToBSCWallet = async (networkId, networkName) => {
	try {
		// Otherwise we enable ethereum if needed (modern browsers)
		if (window.BinanceChain) {
			window.BinanceChain.autoRefreshOnNetworkChange = true;
			await window.BinanceChain.enable();
		}
		const accounts = await snxJSConnector.signer.getNextAddresses();
		if (accounts && accounts.length > 0) {
			return {
				currentWallet: accounts[0],
				walletType: 'BSCWallet',
				unlocked: true,
				networkId,
				networkName: networkName.toLowerCase(),
			};
		} else {
			return {
				walletType: 'BSCWallet',
				unlocked: false,
				unlockReason: 'BSCWalletNoAccounts',
			};
		}
		// We updateWalletStatus with all the infos
	} catch (e) {
		console.log(e);
		return {
			walletType: 'BSCWallet',
			unlocked: false,
			unlockReason: 'ErrorWhileConnectingToBSCWallet',
			unlockMessage: e,
		};
	}
};

const connectToCoinbase = async (networkId, networkName) => {
	try {
		const accounts = await snxJSConnector.signer.getNextAddresses();
		if (accounts && accounts.length > 0) {
			return {
				currentWallet: accounts[0],
				walletType: 'Coinbase',
				unlocked: true,
				networkId: 1,
				networkName: networkName.toLowerCase(),
			};
		} else {
			return {
				walletType: 'Coinbase',
				unlocked: false,
				unlockReason: 'CoinbaseNoAccounts',
			};
		}
		// We updateWalletStatus with all the infos
	} catch (e) {
		console.log(e);
		return {
			walletType: 'Coinbase',
			unlocked: false,
			unlockReason: 'ErrorWhileConnectingToCoinbase',
			unlockMessage: e,
		};
	}
};

const connectToHardwareWallet = (networkId, networkName, walletType) => {
	return {
		walletType,
		unlocked: true,
		networkId,
		networkName: networkName.toLowerCase(),
	};
};

const connectToWalletConnect = async (networkId, networkName) => {
	try {
		await snxJSConnector.signer.provider._web3Provider.enable();
		const accounts = await snxJSConnector.signer.getNextAddresses();
		if (accounts && accounts.length > 0) {
			return {
				currentWallet: accounts[0],
				walletType: 'WalletConnect',
				unlocked: true,
				networkId,
				networkName: networkName.toLowerCase(),
			};
		}
	} catch (e) {
		console.log(e);
		return {
			walletType: 'WalletConnect',
			unlocked: false,
			unlockReason: 'ErrorWhileConnectingToWalletConnect',
			unlockMessage: e,
		};
	}
};

const getSignerConfig = ({ type, networkId, derivationPath }) => {
	if (type === 'Ledger') {
		const DEFAULT_LEDGER_DERIVATION_PATH = "44'/60'/0'/";
		return { derivationPath: derivationPath || DEFAULT_LEDGER_DERIVATION_PATH };
	}
	if (type === 'Coinbase') {
		return {
			appName: 'Mintr',
			appLogoUrl: `${window.location.origin}/images/mintr-leaf-logo.png`,
			jsonRpcUrl: INFURA_JSON_RPC_URLS[networkId],
			networkId,
		};
	}

	if (type === 'WalletConnect') {
		return {
			infuraId: process.env.REACT_APP_INFURA_PROJECT_ID,
		};
	}

	return {};
};

export const setSigner = ({ type, networkId, derivationPath }) => {
	//.log(snxJSConnector.signers);
	//console.log(getSignerConfig({ type, networkId, derivationPath }));

	const signer = new snxJSConnector.signers[type](
		getSignerConfig({ type, networkId, derivationPath })
	);
	 
	snxJSConnector.setContractSettings({
		networkId,
		signer,
	});
};

export const connectToWallet = async ({ wallet, derivationPath }) => {
	//const { name, networkId } = await getEthereumNetwork();
	const name = 'bsc';
	const networkId = 56;
	if (!name) {
		return {
			walletType: '',
			unlocked: false,
			unlockReason: 'NetworkNotSupported',
		};
	}
	 

	setSigner({ type: wallet, networkId, derivationPath });

	switch (wallet) {
		case 'Metamask':
			return connectToMetamask(networkId, name);
		case 'BSCWallet':
			return connectToBSCWallet(networkId, name);
		case 'Coinbase':
			return connectToCoinbase(networkId, name);
		case 'Trezor':
		case 'Ledger':
			return connectToHardwareWallet(networkId, name, wallet);
		case 'WalletConnect':
			return connectToWalletConnect(networkId, name);
		default:
			return {};
	}
};

export default snxJSConnector;
