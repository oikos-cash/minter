import numbro from 'numbro';
import snxJSConnector from '../helpers/snxJSConnector';

export const formatCurrency = (value, decimals = 4) => {
	if (!value) return 0;
	if (!Number(value)) return 0;
	return numbro(value).format('0,0.' + '0'.repeat(decimals));
};

export const shortenAddress = address => {
	if (!address) return null;
	return address.slice(0, 6) + '...' + address.slice(-4, address.length);
};

function str_pad_left(string, pad, length) {
	return (new Array(length + 1).join(pad) + string).slice(-length);
}

export const toBigNumber = input => snxJSConnector.utils.parseEther(`${input}`);

export const bytesFormatter = input => snxJSConnector.ethersUtils.formatBytes32String(input);

export const bigNumberFormatter = value => Number(snxJSConnector.utils.formatEther(value));

export const bigNumberToStringFormatter = value => snxJSConnector.utils.formatEther(value);

export const parseBytes32String = input => snxJSConnector.ethersUtils.parseBytes32String(input);

export const getAddress = addr => snxJSConnector.ethersUtils.getAddress(addr);

export const secondsToTime = seconds => {
	const hours = Math.floor(seconds / 3600);
	const minutes = Math.floor((seconds - hours * 3600) / 60);
	if (hours > 0) {
		return `${hours}h ${str_pad_left(minutes, '0', 2)}m`;
	} else if (minutes > 0) {
		return `${str_pad_left(minutes, '0', 2)} mins`;
	}
	return `up to 1 minute`;
};

// exported for tests
export const getOusdInUsd = async () => {
	const { uniswapV2Contract } = snxJSConnector;

	let oBNBPrice = await snxJSConnector.snxJS.ExchangeRates.ratesForCurrencies(
		['oBNB'].map(bytesFormatter)
	);
	oBNBPrice = oBNBPrice / 1e18

	const [ reserves ] = await Promise.all([
		uniswapV2Contract.getReserves(),
	]) 
	let bnb = reserves[1] / 1e18
	let bnbReserveUSDValue = bnb * oBNBPrice
	let price = bnbReserveUSDValue / (reserves[0] / 1e18)
	console.log(`x is ${bnbReserveUSDValue} y ${reserves[0] / 1e18}`)

	return price
};

export const oksToUSD = async () => {
	const {  uniswapOKSContract } = snxJSConnector;

	let oBNBPrice = await snxJSConnector.snxJS.ExchangeRates.ratesForCurrencies(
		['oBNB'].map(bytesFormatter)
	);
	oBNBPrice = oBNBPrice / 1e18

	const [ reserves ] = await Promise.all([
		uniswapOKSContract.getReserves(),
	]) 
	let bnb = reserves[1] / 1e18
	let bnbReserveUSDValue = bnb * oBNBPrice
	let price = bnbReserveUSDValue / (reserves[0] / 1e18)
	console.log(`x is ${bnbReserveUSDValue} y ${reserves[0] / 1e18}`)

	return price
};