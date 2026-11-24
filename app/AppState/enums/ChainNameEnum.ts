export enum ChainNameEnum {
  mainChainName = 'main',
  testChainName = 'test',
  regtestChainName = 'regtest',
  catecashDevnetChainName = 'catecash-devnet',
  catecashTestnetChainName = 'catecash-testnet',
  catecashMainnetChainName = 'catecash-mainnet',
  // An unknown chain: a wallet whose chain could not be read, or an offline
  // server saved before offline carried one.
  noneChainName = '',
}
