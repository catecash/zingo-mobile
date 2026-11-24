import {
  catecashAtomicBalance,
  atomicString,
} from '@app/walletBackend/utils/catecashAtomicBalance';
import { RPCBalancesType } from '@app/walletBackend/types/RPCBalancesType';

test('Tests that scanned pool balances sum exactly above 2^53', () => {
  const balance = {
    total_ironwood_balance: '9007199254740993',
    total_orchard_balance: '18446744073709551616',
    total_sapling_balance: '1',
    total_transparent_balance: '0',
  } as RPCBalancesType;
  expect(catecashAtomicBalance(balance).total).toBe('18455751272964292610');
});

test('Tests that an unsafe JSON number fails before display', () => {
  expect(() => atomicString(9007199254740992)).toThrow('exact atomic string');
});
