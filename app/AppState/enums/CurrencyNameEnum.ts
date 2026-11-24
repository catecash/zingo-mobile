import { ChainNameEnum } from './ChainNameEnum';

export enum CurrencyNameEnum {
  ZEC = 'ZEC',
  TAZ = 'TAZ',
  CATE = 'CATE',
}

export const currencyForChain = (chain: ChainNameEnum): CurrencyNameEnum => {
  if (
    chain === ChainNameEnum.catecashDevnetChainName ||
    chain === ChainNameEnum.catecashTestnetChainName ||
    chain === ChainNameEnum.catecashMainnetChainName
  )
    return CurrencyNameEnum.CATE;
  return chain === ChainNameEnum.mainChainName
    ? CurrencyNameEnum.ZEC
    : CurrencyNameEnum.TAZ;
};
