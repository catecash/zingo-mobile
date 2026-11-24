import {
  RPCBalancesType,
  RPCAtomicBalance,
} from '@app/walletBackend/types/RPCBalancesType';

export function atomicString(value: RPCAtomicBalance | undefined): string {
  if (value == null) return '0';
  if (typeof value === 'number') {
    if (!Number.isSafeInteger(value) || value < 0) {
      throw new Error('Catecash balance requires an exact atomic string');
    }
    return String(value);
  }
  if (!/^\d+$/.test(value)) {
    throw new Error('Invalid Catecash atomic balance');
  }
  return value;
}

export function catecashAtomicBalance(balance: RPCBalancesType) {
  const ironwood = atomicString(balance.total_ironwood_balance);
  const orchard = atomicString(balance.total_orchard_balance);
  const sapling = atomicString(balance.total_sapling_balance);
  const transparent = atomicString(balance.total_transparent_balance);
  return {
    ironwood,
    orchard,
    sapling,
    transparent,
    confirmedIronwood: atomicString(balance.confirmed_ironwood_balance),
    confirmedOrchard: atomicString(balance.confirmed_orchard_balance),
    confirmedSapling: atomicString(balance.confirmed_sapling_balance),
    confirmedTransparent: atomicString(balance.confirmed_transparent_balance),
    total: [ironwood, orchard, sapling, transparent]
      .reduce((sum, part) => sum + BigInt(part), 0n)
      .toString(),
  };
}
