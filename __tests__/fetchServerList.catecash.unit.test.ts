import { ChainNameEnum } from '@app/AppState';
import fetchServerList from '@app/uris/fetchServerList';

test.each([
  ChainNameEnum.catecashDevnetChainName,
  ChainNameEnum.catecashTestnetChainName,
  ChainNameEnum.catecashMainnetChainName,
])('Tests that %s skips the Zcash server registry', async chain => {
  const fetchSpy = jest.spyOn(global, 'fetch');
  try {
    expect(await fetchServerList(chain)).toEqual([]);
    expect(fetchSpy).not.toHaveBeenCalled();
  } finally {
    fetchSpy.mockRestore();
  }
});
