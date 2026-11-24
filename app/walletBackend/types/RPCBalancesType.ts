export type RPCAtomicBalance = number | string | null;

export type RPCBalancesType = {
  total_orchard_balance: RPCAtomicBalance;
  total_sapling_balance: RPCAtomicBalance;
  total_transparent_balance: RPCAtomicBalance;

  confirmed_transparent_balance: RPCAtomicBalance;
  confirmed_orchard_balance: RPCAtomicBalance;
  confirmed_sapling_balance: RPCAtomicBalance;

  unconfirmed_orchard_balance: RPCAtomicBalance;
  unconfirmed_sapling_balance: RPCAtomicBalance;
  unconfirmed_transparent_balance: RPCAtomicBalance;

  // Ironwood (NU6.3) pool. zingolib emits these as Option, so they may be
  // null/absent before activation or on wallets without Ironwood funds.
  total_ironwood_balance?: RPCAtomicBalance;
  confirmed_ironwood_balance?: RPCAtomicBalance;
  unconfirmed_ironwood_balance?: RPCAtomicBalance;
};
