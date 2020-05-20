"use strict";

const {
  scalar,
  bigUInt1,
  bigUInt2,
  resolveBigUInt,
  struct,
  array,
  join,
  joinArray,
  enumName,
  createEnumNameResolver,
  resolveUnixTimeString
} = require('./db-types.js');

const OtherCurrency = struct({
  currency: scalar,
  value: bigUInt2
});
const ExtBlkRef = struct({
  end_lt: bigUInt1,
  seq_no: scalar,
  root_hash: scalar,
  file_hash: scalar
});
const MsgEnvelope = struct({
  msg_id: scalar,
  next_addr: scalar,
  cur_addr: scalar,
  fwd_fee_remaining: bigUInt2
});
const InMsg = struct({
  msg_type: scalar,
  msg_type_name: enumName('msg_type', {
    External: 0,
    Ihr: 1,
    Immediately: 2,
    Final: 3,
    Transit: 4,
    DiscardedFinal: 5,
    DiscardedTransit: 6
  }),
  msg_id: scalar,
  ihr_fee: bigUInt2,
  proof_created: scalar,
  in_msg: MsgEnvelope,
  fwd_fee: bigUInt2,
  out_msg: MsgEnvelope,
  transit_fee: bigUInt2,
  transaction_id: scalar,
  proof_delivered: scalar
});
const OutMsg = struct({
  msg_type: scalar,
  msg_type_name: enumName('msg_type', {
    External: 0,
    Immediately: 1,
    OutMsgNew: 2,
    Transit: 3,
    DequeueImmediately: 4,
    Dequeue: 5,
    TransitRequired: 6,
    DequeueShort: 7,
    None: -1
  }),
  msg_id: scalar,
  transaction_id: scalar,
  out_msg: MsgEnvelope,
  reimport: InMsg,
  imported: InMsg,
  import_block_lt: bigUInt1,
  msg_env_hash: scalar,
  next_workchain: scalar,
  next_addr_pfx: bigUInt1
});
const OtherCurrencyArray = array(() => OtherCurrency);
const BlockValueFlow = struct({
  to_next_blk: bigUInt2,
  to_next_blk_other: OtherCurrencyArray,
  exported: bigUInt2,
  exported_other: OtherCurrencyArray,
  fees_collected: bigUInt2,
  fees_collected_other: OtherCurrencyArray,
  created: bigUInt2,
  created_other: OtherCurrencyArray,
  imported: bigUInt2,
  imported_other: OtherCurrencyArray,
  from_prev_blk: bigUInt2,
  from_prev_blk_other: OtherCurrencyArray,
  minted: bigUInt2,
  minted_other: OtherCurrencyArray,
  fees_imported: bigUInt2,
  fees_imported_other: OtherCurrencyArray
});
const BlockAccountBlocksTransactions = struct({
  lt: bigUInt1,
  transaction_id: scalar,
  total_fees: bigUInt2,
  total_fees_other: OtherCurrencyArray
});
const BlockAccountBlocksTransactionsArray = array(() => BlockAccountBlocksTransactions);
const BlockAccountBlocks = struct({
  account_addr: scalar,
  transactions: BlockAccountBlocksTransactionsArray,
  old_hash: scalar,
  new_hash: scalar,
  tr_count: scalar
});
const BlockStateUpdate = struct({
  new: scalar,
  new_hash: scalar,
  new_depth: scalar,
  old: scalar,
  old_hash: scalar,
  old_depth: scalar
});
const BlockMasterShardHashesDescr = struct({
  seq_no: scalar,
  reg_mc_seqno: scalar,
  start_lt: bigUInt1,
  end_lt: bigUInt1,
  root_hash: scalar,
  file_hash: scalar,
  before_split: scalar,
  before_merge: scalar,
  want_split: scalar,
  want_merge: scalar,
  nx_cc_updated: scalar,
  flags: scalar,
  next_catchain_seqno: scalar,
  next_validator_shard: scalar,
  min_ref_mc_seqno: scalar,
  gen_utime: scalar,
  split_type: scalar,
  split_type_name: enumName('split_type', {
    None: 0,
    Split: 2,
    Merge: 3
  }),
  split: scalar,
  fees_collected: bigUInt2,
  fees_collected_other: OtherCurrencyArray,
  funds_created: bigUInt2,
  funds_created_other: OtherCurrencyArray
});
const BlockMasterShardHashes = struct({
  workchain_id: scalar,
  shard: scalar,
  descr: BlockMasterShardHashesDescr
});
const BlockMasterShardFees = struct({
  workchain_id: scalar,
  shard: scalar,
  fees: bigUInt2,
  fees_other: OtherCurrencyArray,
  create: bigUInt2,
  create_other: OtherCurrencyArray
});
const BlockMasterPrevBlkSignatures = struct({
  node_id: scalar,
  r: scalar,
  s: scalar
});
const BlockMasterConfigP6 = struct({
  mint_new_price: scalar,
  mint_add_price: scalar
});
const BlockMasterConfigP7 = struct({
  currency: scalar,
  value: scalar
});
const BlockMasterConfigP8 = struct({
  version: scalar,
  capabilities: scalar
});
const ConfigProposalSetup = struct({
  min_tot_rounds: scalar,
  max_tot_rounds: scalar,
  min_wins: scalar,
  max_losses: scalar,
  min_store_sec: scalar,
  max_store_sec: scalar,
  bit_price: scalar,
  cell_price: scalar
});
const BlockMasterConfigP11 = struct({
  normal_params: ConfigProposalSetup,
  critical_params: ConfigProposalSetup
});
const BlockMasterConfigP12 = struct({
  workchain_id: scalar,
  enabled_since: scalar,
  actual_min_split: scalar,
  min_split: scalar,
  max_split: scalar,
  active: scalar,
  accept_msgs: scalar,
  flags: scalar,
  zerostate_root_hash: scalar,
  zerostate_file_hash: scalar,
  version: scalar,
  basic: scalar,
  vm_version: scalar,
  vm_mode: scalar,
  min_addr_len: scalar,
  max_addr_len: scalar,
  addr_len_step: scalar,
  workchain_type_id: scalar
});
const BlockMasterConfigP14 = struct({
  masterchain_block_fee: bigUInt2,
  basechain_block_fee: bigUInt2
});
const BlockMasterConfigP15 = struct({
  validators_elected_for: scalar,
  elections_start_before: scalar,
  elections_end_before: scalar,
  stake_held_for: scalar
});
const BlockMasterConfigP16 = struct({
  max_validators: scalar,
  max_main_validators: scalar,
  min_validators: scalar
});
const BlockMasterConfigP17 = struct({
  min_stake: bigUInt2,
  max_stake: bigUInt2,
  min_total_stake: bigUInt2,
  max_stake_factor: scalar
});
const BlockMasterConfigP18 = struct({
  utime_since: scalar,
  bit_price_ps: bigUInt1,
  cell_price_ps: bigUInt1,
  mc_bit_price_ps: bigUInt1,
  mc_cell_price_ps: bigUInt1
});
const GasLimitsPrices = struct({
  gas_price: bigUInt1,
  gas_limit: bigUInt1,
  special_gas_limit: bigUInt1,
  gas_credit: bigUInt1,
  block_gas_limit: bigUInt1,
  freeze_due_limit: bigUInt1,
  delete_due_limit: bigUInt1,
  flat_gas_limit: bigUInt1,
  flat_gas_price: bigUInt1
});
const BlockLimitsBytes = struct({
  underload: scalar,
  soft_limit: scalar,
  hard_limit: scalar
});
const BlockLimitsGas = struct({
  underload: scalar,
  soft_limit: scalar,
  hard_limit: scalar
});
const BlockLimitsLtDelta = struct({
  underload: scalar,
  soft_limit: scalar,
  hard_limit: scalar
});
const BlockLimits = struct({
  bytes: BlockLimitsBytes,
  gas: BlockLimitsGas,
  lt_delta: BlockLimitsLtDelta
});
const MsgForwardPrices = struct({
  lump_price: bigUInt1,
  bit_price: bigUInt1,
  cell_price: bigUInt1,
  ihr_price_factor: scalar,
  first_frac: scalar,
  next_frac: scalar
});
const BlockMasterConfigP28 = struct({
  shuffle_mc_validators: scalar,
  mc_catchain_lifetime: scalar,
  shard_catchain_lifetime: scalar,
  shard_validators_lifetime: scalar,
  shard_validators_num: scalar
});
const BlockMasterConfigP29 = struct({
  new_catchain_ids: scalar,
  round_candidates: scalar,
  next_candidate_delay_ms: scalar,
  consensus_timeout_ms: scalar,
  fast_attempts: scalar,
  attempt_duration: scalar,
  catchain_max_deps: scalar,
  max_block_bytes: scalar,
  max_collated_bytes: scalar
});
const ValidatorSetList = struct({
  public_key: scalar,
  weight: bigUInt1,
  adnl_addr: scalar
});
const ValidatorSetListArray = array(() => ValidatorSetList);
const ValidatorSet = struct({
  utime_since: scalar,
  utime_until: scalar,
  total: scalar,
  total_weight: bigUInt1,
  list: ValidatorSetListArray
});
const BlockMasterConfigP39 = struct({
  adnl_addr: scalar,
  temp_public_key: scalar,
  seqno: scalar,
  valid_until: scalar,
  signature_r: scalar,
  signature_s: scalar
});
const BlockMasterConfigP7Array = array(() => BlockMasterConfigP7);
const FloatArray = array(() => scalar);
const BlockMasterConfigP12Array = array(() => BlockMasterConfigP12);
const BlockMasterConfigP18Array = array(() => BlockMasterConfigP18);
const StringArray = array(() => scalar);
const BlockMasterConfigP39Array = array(() => BlockMasterConfigP39);
const BlockMasterConfig = struct({
  p0: scalar,
  p1: scalar,
  p2: scalar,
  p3: scalar,
  p4: scalar,
  p6: BlockMasterConfigP6,
  p7: BlockMasterConfigP7Array,
  p8: BlockMasterConfigP8,
  p9: FloatArray,
  p10: FloatArray,
  p11: BlockMasterConfigP11,
  p12: BlockMasterConfigP12Array,
  p14: BlockMasterConfigP14,
  p15: BlockMasterConfigP15,
  p16: BlockMasterConfigP16,
  p17: BlockMasterConfigP17,
  p18: BlockMasterConfigP18Array,
  p20: GasLimitsPrices,
  p21: GasLimitsPrices,
  p22: BlockLimits,
  p23: BlockLimits,
  p24: MsgForwardPrices,
  p25: MsgForwardPrices,
  p28: BlockMasterConfigP28,
  p29: BlockMasterConfigP29,
  p31: StringArray,
  p32: ValidatorSet,
  p33: ValidatorSet,
  p34: ValidatorSet,
  p35: ValidatorSet,
  p36: ValidatorSet,
  p37: ValidatorSet,
  p39: BlockMasterConfigP39Array
});
const BlockMasterShardHashesArray = array(() => BlockMasterShardHashes);
const BlockMasterShardFeesArray = array(() => BlockMasterShardFees);
const BlockMasterPrevBlkSignaturesArray = array(() => BlockMasterPrevBlkSignatures);
const BlockMaster = struct({
  min_shard_gen_utime: scalar,
  max_shard_gen_utime: scalar,
  shard_hashes: BlockMasterShardHashesArray,
  shard_fees: BlockMasterShardFeesArray,
  recover_create_msg: InMsg,
  prev_blk_signatures: BlockMasterPrevBlkSignaturesArray,
  config_addr: scalar,
  config: BlockMasterConfig
});
const BlockSignaturesSignatures = struct({
  node_id: scalar,
  r: scalar,
  s: scalar
});
const BlockSignaturesSignaturesArray = array(() => BlockSignaturesSignatures);
const BlockSignatures = struct({
  id: scalar,
  gen_utime: scalar,
  seq_no: scalar,
  shard: scalar,
  workchain_id: scalar,
  proof: scalar,
  validator_list_hash_short: scalar,
  catchain_seqno: scalar,
  sig_weight: bigUInt1,
  signatures: BlockSignaturesSignaturesArray,
  block: join('id', 'id', 'blocks', () => Block)
}, true);
const InMsgArray = array(() => InMsg);
const OutMsgArray = array(() => OutMsg);
const BlockAccountBlocksArray = array(() => BlockAccountBlocks);
const Block = struct({
  id: scalar,
  status: scalar,
  status_name: enumName('status', {
    Unknown: 0,
    Proposed: 1,
    Finalized: 2,
    Refused: 3
  }),
  global_id: scalar,
  want_split: scalar,
  seq_no: scalar,
  after_merge: scalar,
  gen_utime: scalar,
  gen_catchain_seqno: scalar,
  flags: scalar,
  master_ref: ExtBlkRef,
  prev_ref: ExtBlkRef,
  prev_alt_ref: ExtBlkRef,
  prev_vert_ref: ExtBlkRef,
  prev_vert_alt_ref: ExtBlkRef,
  version: scalar,
  gen_validator_list_hash_short: scalar,
  before_split: scalar,
  after_split: scalar,
  want_merge: scalar,
  vert_seq_no: scalar,
  start_lt: bigUInt1,
  end_lt: bigUInt1,
  workchain_id: scalar,
  shard: scalar,
  min_ref_mc_seqno: scalar,
  prev_key_block_seqno: scalar,
  gen_software_version: scalar,
  gen_software_capabilities: scalar,
  value_flow: BlockValueFlow,
  in_msg_descr: InMsgArray,
  rand_seed: scalar,
  out_msg_descr: OutMsgArray,
  account_blocks: BlockAccountBlocksArray,
  tr_count: scalar,
  state_update: BlockStateUpdate,
  master: BlockMaster,
  key_block: scalar,
  boc: scalar,
  signatures: join('id', 'id', 'blocks_signatures', () => BlockSignatures)
}, true);
const TransactionStorage = struct({
  storage_fees_collected: bigUInt2,
  storage_fees_due: bigUInt2,
  status_change: scalar,
  status_change_name: enumName('status_change', {
    Unchanged: 0,
    Frozen: 1,
    Deleted: 2
  })
});
const TransactionCredit = struct({
  due_fees_collected: bigUInt2,
  credit: bigUInt2,
  credit_other: OtherCurrencyArray
});
const TransactionCompute = struct({
  compute_type: scalar,
  compute_type_name: enumName('compute_type', {
    Skipped: 0,
    Vm: 1
  }),
  skipped_reason: scalar,
  skipped_reason_name: enumName('skipped_reason', {
    NoState: 0,
    BadState: 1,
    NoGas: 2
  }),
  success: scalar,
  msg_state_used: scalar,
  account_activated: scalar,
  gas_fees: bigUInt2,
  gas_used: bigUInt1,
  gas_limit: bigUInt1,
  gas_credit: scalar,
  mode: scalar,
  exit_code: scalar,
  exit_arg: scalar,
  vm_steps: scalar,
  vm_init_state_hash: scalar,
  vm_final_state_hash: scalar
});
const TransactionAction = struct({
  success: scalar,
  valid: scalar,
  no_funds: scalar,
  status_change: scalar,
  status_change_name: enumName('status_change', {
    Unchanged: 0,
    Frozen: 1,
    Deleted: 2
  }),
  total_fwd_fees: bigUInt2,
  total_action_fees: bigUInt2,
  result_code: scalar,
  result_arg: scalar,
  tot_actions: scalar,
  spec_actions: scalar,
  skipped_actions: scalar,
  msgs_created: scalar,
  action_list_hash: scalar,
  total_msg_size_cells: scalar,
  total_msg_size_bits: scalar
});
const TransactionBounce = struct({
  bounce_type: scalar,
  bounce_type_name: enumName('bounce_type', {
    NegFunds: 0,
    NoFunds: 1,
    Ok: 2
  }),
  msg_size_cells: scalar,
  msg_size_bits: scalar,
  req_fwd_fees: bigUInt2,
  msg_fees: bigUInt2,
  fwd_fees: bigUInt2
});
const TransactionSplitInfo = struct({
  cur_shard_pfx_len: scalar,
  acc_split_depth: scalar,
  this_addr: scalar,
  sibling_addr: scalar
});
const MessageArray = array(() => Message);
const Transaction = struct({
  id: scalar,
  tr_type: scalar,
  tr_type_name: enumName('tr_type', {
    Ordinary: 0,
    Storage: 1,
    Tick: 2,
    Tock: 3,
    SplitPrepare: 4,
    SplitInstall: 5,
    MergePrepare: 6,
    MergeInstall: 7
  }),
  status: scalar,
  status_name: enumName('status', {
    Unknown: 0,
    Preliminary: 1,
    Proposed: 2,
    Finalized: 3,
    Refused: 4
  }),
  block_id: scalar,
  block: join('block_id', 'id', 'blocks', () => Block),
  account_addr: scalar,
  workchain_id: scalar,
  lt: bigUInt1,
  prev_trans_hash: scalar,
  prev_trans_lt: bigUInt1,
  now: scalar,
  outmsg_cnt: scalar,
  orig_status: scalar,
  orig_status_name: enumName('orig_status', {
    Uninit: 0,
    Active: 1,
    Frozen: 2,
    NonExist: 3
  }),
  end_status: scalar,
  end_status_name: enumName('end_status', {
    Uninit: 0,
    Active: 1,
    Frozen: 2,
    NonExist: 3
  }),
  in_msg: scalar,
  in_message: join('in_msg', 'id', 'messages', () => Message),
  out_msgs: StringArray,
  out_messages: joinArray('out_msgs', 'id', 'messages', () => Message),
  total_fees: bigUInt2,
  total_fees_other: OtherCurrencyArray,
  old_hash: scalar,
  new_hash: scalar,
  credit_first: scalar,
  storage: TransactionStorage,
  credit: TransactionCredit,
  compute: TransactionCompute,
  action: TransactionAction,
  bounce: TransactionBounce,
  aborted: scalar,
  destroyed: scalar,
  tt: scalar,
  split_info: TransactionSplitInfo,
  prepare_transaction: scalar,
  installed: scalar,
  proof: scalar,
  boc: scalar
}, true);
const Message = struct({
  id: scalar,
  msg_type: scalar,
  msg_type_name: enumName('msg_type', {
    Internal: 0,
    ExtIn: 1,
    ExtOut: 2
  }),
  status: scalar,
  status_name: enumName('status', {
    Unknown: 0,
    Queued: 1,
    Processing: 2,
    Preliminary: 3,
    Proposed: 4,
    Finalized: 5,
    Refused: 6,
    Transiting: 7
  }),
  block_id: scalar,
  block: join('block_id', 'id', 'blocks', () => Block),
  body: scalar,
  body_hash: scalar,
  split_depth: scalar,
  tick: scalar,
  tock: scalar,
  code: scalar,
  code_hash: scalar,
  data: scalar,
  data_hash: scalar,
  library: scalar,
  library_hash: scalar,
  src: scalar,
  dst: scalar,
  src_workchain_id: scalar,
  dst_workchain_id: scalar,
  created_lt: bigUInt1,
  created_at: scalar,
  ihr_disabled: scalar,
  ihr_fee: bigUInt2,
  fwd_fee: bigUInt2,
  import_fee: bigUInt2,
  bounce: scalar,
  bounced: scalar,
  value: bigUInt2,
  value_other: OtherCurrencyArray,
  proof: scalar,
  boc: scalar,
  src_transaction: join('id', 'out_msgs[*]', 'transactions', () => Transaction),
  dst_transaction: join('id', 'in_msg', 'transactions', () => Transaction)
}, true);
const Account = struct({
  id: scalar,
  workchain_id: scalar,
  acc_type: scalar,
  acc_type_name: enumName('acc_type', {
    Uninit: 0,
    Active: 1,
    Frozen: 2
  }),
  last_paid: scalar,
  due_payment: bigUInt2,
  last_trans_lt: bigUInt1,
  balance: bigUInt2,
  balance_other: OtherCurrencyArray,
  split_depth: scalar,
  tick: scalar,
  tock: scalar,
  code: scalar,
  code_hash: scalar,
  data: scalar,
  data_hash: scalar,
  library: scalar,
  library_hash: scalar,
  proof: scalar,
  boc: scalar
}, true);

function createResolvers(db) {
  return {
    OtherCurrency: {
      value(parent, args) {
        return resolveBigUInt(2, parent.value, args);
      }

    },
    ExtBlkRef: {
      end_lt(parent, args) {
        return resolveBigUInt(1, parent.end_lt, args);
      }

    },
    MsgEnvelope: {
      fwd_fee_remaining(parent, args) {
        return resolveBigUInt(2, parent.fwd_fee_remaining, args);
      }

    },
    InMsg: {
      ihr_fee(parent, args) {
        return resolveBigUInt(2, parent.ihr_fee, args);
      },

      fwd_fee(parent, args) {
        return resolveBigUInt(2, parent.fwd_fee, args);
      },

      transit_fee(parent, args) {
        return resolveBigUInt(2, parent.transit_fee, args);
      },

      msg_type_name: createEnumNameResolver('msg_type', {
        External: 0,
        Ihr: 1,
        Immediately: 2,
        Final: 3,
        Transit: 4,
        DiscardedFinal: 5,
        DiscardedTransit: 6
      })
    },
    OutMsg: {
      import_block_lt(parent, args) {
        return resolveBigUInt(1, parent.import_block_lt, args);
      },

      next_addr_pfx(parent, args) {
        return resolveBigUInt(1, parent.next_addr_pfx, args);
      },

      msg_type_name: createEnumNameResolver('msg_type', {
        External: 0,
        Immediately: 1,
        OutMsgNew: 2,
        Transit: 3,
        DequeueImmediately: 4,
        Dequeue: 5,
        TransitRequired: 6,
        DequeueShort: 7,
        None: -1
      })
    },
    BlockValueFlow: {
      to_next_blk(parent, args) {
        return resolveBigUInt(2, parent.to_next_blk, args);
      },

      exported(parent, args) {
        return resolveBigUInt(2, parent.exported, args);
      },

      fees_collected(parent, args) {
        return resolveBigUInt(2, parent.fees_collected, args);
      },

      created(parent, args) {
        return resolveBigUInt(2, parent.created, args);
      },

      imported(parent, args) {
        return resolveBigUInt(2, parent.imported, args);
      },

      from_prev_blk(parent, args) {
        return resolveBigUInt(2, parent.from_prev_blk, args);
      },

      minted(parent, args) {
        return resolveBigUInt(2, parent.minted, args);
      },

      fees_imported(parent, args) {
        return resolveBigUInt(2, parent.fees_imported, args);
      }

    },
    BlockAccountBlocksTransactions: {
      lt(parent, args) {
        return resolveBigUInt(1, parent.lt, args);
      },

      total_fees(parent, args) {
        return resolveBigUInt(2, parent.total_fees, args);
      }

    },
    BlockMasterShardHashesDescr: {
      start_lt(parent, args) {
        return resolveBigUInt(1, parent.start_lt, args);
      },

      end_lt(parent, args) {
        return resolveBigUInt(1, parent.end_lt, args);
      },

      fees_collected(parent, args) {
        return resolveBigUInt(2, parent.fees_collected, args);
      },

      funds_created(parent, args) {
        return resolveBigUInt(2, parent.funds_created, args);
      },

      gen_utime_string(parent, args) {
        return resolveUnixTimeString(parent.gen_utime);
      },

      split_type_name: createEnumNameResolver('split_type', {
        None: 0,
        Split: 2,
        Merge: 3
      })
    },
    BlockMasterShardFees: {
      fees(parent, args) {
        return resolveBigUInt(2, parent.fees, args);
      },

      create(parent, args) {
        return resolveBigUInt(2, parent.create, args);
      }

    },
    BlockMasterConfigP14: {
      masterchain_block_fee(parent, args) {
        return resolveBigUInt(2, parent.masterchain_block_fee, args);
      },

      basechain_block_fee(parent, args) {
        return resolveBigUInt(2, parent.basechain_block_fee, args);
      }

    },
    BlockMasterConfigP17: {
      min_stake(parent, args) {
        return resolveBigUInt(2, parent.min_stake, args);
      },

      max_stake(parent, args) {
        return resolveBigUInt(2, parent.max_stake, args);
      },

      min_total_stake(parent, args) {
        return resolveBigUInt(2, parent.min_total_stake, args);
      }

    },
    BlockMasterConfigP18: {
      bit_price_ps(parent, args) {
        return resolveBigUInt(1, parent.bit_price_ps, args);
      },

      cell_price_ps(parent, args) {
        return resolveBigUInt(1, parent.cell_price_ps, args);
      },

      mc_bit_price_ps(parent, args) {
        return resolveBigUInt(1, parent.mc_bit_price_ps, args);
      },

      mc_cell_price_ps(parent, args) {
        return resolveBigUInt(1, parent.mc_cell_price_ps, args);
      },

      utime_since_string(parent, args) {
        return resolveUnixTimeString(parent.utime_since);
      }

    },
    GasLimitsPrices: {
      gas_price(parent, args) {
        return resolveBigUInt(1, parent.gas_price, args);
      },

      gas_limit(parent, args) {
        return resolveBigUInt(1, parent.gas_limit, args);
      },

      special_gas_limit(parent, args) {
        return resolveBigUInt(1, parent.special_gas_limit, args);
      },

      gas_credit(parent, args) {
        return resolveBigUInt(1, parent.gas_credit, args);
      },

      block_gas_limit(parent, args) {
        return resolveBigUInt(1, parent.block_gas_limit, args);
      },

      freeze_due_limit(parent, args) {
        return resolveBigUInt(1, parent.freeze_due_limit, args);
      },

      delete_due_limit(parent, args) {
        return resolveBigUInt(1, parent.delete_due_limit, args);
      },

      flat_gas_limit(parent, args) {
        return resolveBigUInt(1, parent.flat_gas_limit, args);
      },

      flat_gas_price(parent, args) {
        return resolveBigUInt(1, parent.flat_gas_price, args);
      }

    },
    MsgForwardPrices: {
      lump_price(parent, args) {
        return resolveBigUInt(1, parent.lump_price, args);
      },

      bit_price(parent, args) {
        return resolveBigUInt(1, parent.bit_price, args);
      },

      cell_price(parent, args) {
        return resolveBigUInt(1, parent.cell_price, args);
      }

    },
    ValidatorSetList: {
      weight(parent, args) {
        return resolveBigUInt(1, parent.weight, args);
      }

    },
    ValidatorSet: {
      total_weight(parent, args) {
        return resolveBigUInt(1, parent.total_weight, args);
      },

      utime_since_string(parent, args) {
        return resolveUnixTimeString(parent.utime_since);
      },

      utime_until_string(parent, args) {
        return resolveUnixTimeString(parent.utime_until);
      }

    },
    BlockSignatures: {
      id(parent) {
        return parent._key;
      },

      block(parent, args, context) {
        return context.db.blocks.waitForDoc(parent._key, '_key', args);
      },

      sig_weight(parent, args) {
        return resolveBigUInt(1, parent.sig_weight, args);
      },

      gen_utime_string(parent, args) {
        return resolveUnixTimeString(parent.gen_utime);
      }

    },
    Block: {
      id(parent) {
        return parent._key;
      },

      signatures(parent, args, context) {
        return context.db.blocks_signatures.waitForDoc(parent._key, '_key', args);
      },

      start_lt(parent, args) {
        return resolveBigUInt(1, parent.start_lt, args);
      },

      end_lt(parent, args) {
        return resolveBigUInt(1, parent.end_lt, args);
      },

      gen_utime_string(parent, args) {
        return resolveUnixTimeString(parent.gen_utime);
      },

      status_name: createEnumNameResolver('status', {
        Unknown: 0,
        Proposed: 1,
        Finalized: 2,
        Refused: 3
      })
    },
    TransactionStorage: {
      storage_fees_collected(parent, args) {
        return resolveBigUInt(2, parent.storage_fees_collected, args);
      },

      storage_fees_due(parent, args) {
        return resolveBigUInt(2, parent.storage_fees_due, args);
      },

      status_change_name: createEnumNameResolver('status_change', {
        Unchanged: 0,
        Frozen: 1,
        Deleted: 2
      })
    },
    TransactionCredit: {
      due_fees_collected(parent, args) {
        return resolveBigUInt(2, parent.due_fees_collected, args);
      },

      credit(parent, args) {
        return resolveBigUInt(2, parent.credit, args);
      }

    },
    TransactionCompute: {
      gas_fees(parent, args) {
        return resolveBigUInt(2, parent.gas_fees, args);
      },

      gas_used(parent, args) {
        return resolveBigUInt(1, parent.gas_used, args);
      },

      gas_limit(parent, args) {
        return resolveBigUInt(1, parent.gas_limit, args);
      },

      compute_type_name: createEnumNameResolver('compute_type', {
        Skipped: 0,
        Vm: 1
      }),
      skipped_reason_name: createEnumNameResolver('skipped_reason', {
        NoState: 0,
        BadState: 1,
        NoGas: 2
      })
    },
    TransactionAction: {
      total_fwd_fees(parent, args) {
        return resolveBigUInt(2, parent.total_fwd_fees, args);
      },

      total_action_fees(parent, args) {
        return resolveBigUInt(2, parent.total_action_fees, args);
      },

      status_change_name: createEnumNameResolver('status_change', {
        Unchanged: 0,
        Frozen: 1,
        Deleted: 2
      })
    },
    TransactionBounce: {
      req_fwd_fees(parent, args) {
        return resolveBigUInt(2, parent.req_fwd_fees, args);
      },

      msg_fees(parent, args) {
        return resolveBigUInt(2, parent.msg_fees, args);
      },

      fwd_fees(parent, args) {
        return resolveBigUInt(2, parent.fwd_fees, args);
      },

      bounce_type_name: createEnumNameResolver('bounce_type', {
        NegFunds: 0,
        NoFunds: 1,
        Ok: 2
      })
    },
    Transaction: {
      id(parent) {
        return parent._key;
      },

      block(parent, args, context) {
        return context.db.blocks.waitForDoc(parent.block_id, '_key', args);
      },

      in_message(parent, args, context) {
        return context.db.messages.waitForDoc(parent.in_msg, '_key', args);
      },

      out_messages(parent, args, context) {
        return context.db.messages.waitForDocs(parent.out_msgs, '_key', args);
      },

      lt(parent, args) {
        return resolveBigUInt(1, parent.lt, args);
      },

      prev_trans_lt(parent, args) {
        return resolveBigUInt(1, parent.prev_trans_lt, args);
      },

      total_fees(parent, args) {
        return resolveBigUInt(2, parent.total_fees, args);
      },

      tr_type_name: createEnumNameResolver('tr_type', {
        Ordinary: 0,
        Storage: 1,
        Tick: 2,
        Tock: 3,
        SplitPrepare: 4,
        SplitInstall: 5,
        MergePrepare: 6,
        MergeInstall: 7
      }),
      status_name: createEnumNameResolver('status', {
        Unknown: 0,
        Preliminary: 1,
        Proposed: 2,
        Finalized: 3,
        Refused: 4
      }),
      orig_status_name: createEnumNameResolver('orig_status', {
        Uninit: 0,
        Active: 1,
        Frozen: 2,
        NonExist: 3
      }),
      end_status_name: createEnumNameResolver('end_status', {
        Uninit: 0,
        Active: 1,
        Frozen: 2,
        NonExist: 3
      })
    },
    Message: {
      id(parent) {
        return parent._key;
      },

      block(parent, args, context) {
        return context.db.blocks.waitForDoc(parent.block_id, '_key', args);
      },

      src_transaction(parent, args, context) {
        return parent.created_lt !== '00' && parent.msg_type !== 1 ? context.db.transactions.waitForDoc(parent._key, 'out_msgs[*]', args) : null;
      },

      dst_transaction(parent, args, context) {
        return parent.msg_type !== 2 ? context.db.transactions.waitForDoc(parent._key, 'in_msg', args) : null;
      },

      created_lt(parent, args) {
        return resolveBigUInt(1, parent.created_lt, args);
      },

      ihr_fee(parent, args) {
        return resolveBigUInt(2, parent.ihr_fee, args);
      },

      fwd_fee(parent, args) {
        return resolveBigUInt(2, parent.fwd_fee, args);
      },

      import_fee(parent, args) {
        return resolveBigUInt(2, parent.import_fee, args);
      },

      value(parent, args) {
        return resolveBigUInt(2, parent.value, args);
      },

      created_at_string(parent, args) {
        return resolveUnixTimeString(parent.created_at);
      },

      msg_type_name: createEnumNameResolver('msg_type', {
        Internal: 0,
        ExtIn: 1,
        ExtOut: 2
      }),
      status_name: createEnumNameResolver('status', {
        Unknown: 0,
        Queued: 1,
        Processing: 2,
        Preliminary: 3,
        Proposed: 4,
        Finalized: 5,
        Refused: 6,
        Transiting: 7
      })
    },
    Account: {
      id(parent) {
        return parent._key;
      },

      due_payment(parent, args) {
        return resolveBigUInt(2, parent.due_payment, args);
      },

      last_trans_lt(parent, args) {
        return resolveBigUInt(1, parent.last_trans_lt, args);
      },

      balance(parent, args) {
        return resolveBigUInt(2, parent.balance, args);
      },

      acc_type_name: createEnumNameResolver('acc_type', {
        Uninit: 0,
        Active: 1,
        Frozen: 2
      })
    },
    Query: {
      blocks_signatures: db.blocks_signatures.queryResolver(),
      blocks: db.blocks.queryResolver(),
      transactions: db.transactions.queryResolver(),
      messages: db.messages.queryResolver(),
      accounts: db.accounts.queryResolver()
    },
    Subscription: {
      blocks_signatures: db.blocks_signatures.subscriptionResolver(),
      blocks: db.blocks.subscriptionResolver(),
      transactions: db.transactions.subscriptionResolver(),
      messages: db.messages.subscriptionResolver(),
      accounts: db.accounts.subscriptionResolver()
    }
  };
}

const scalarFields = new Map();
scalarFields.set('blocks_signatures.id', {
  type: 'string',
  path: 'doc._key'
});
scalarFields.set('blocks_signatures.gen_utime', {
  type: 'number',
  path: 'doc.gen_utime'
});
scalarFields.set('blocks_signatures.seq_no', {
  type: 'number',
  path: 'doc.seq_no'
});
scalarFields.set('blocks_signatures.shard', {
  type: 'string',
  path: 'doc.shard'
});
scalarFields.set('blocks_signatures.workchain_id', {
  type: 'number',
  path: 'doc.workchain_id'
});
scalarFields.set('blocks_signatures.proof', {
  type: 'string',
  path: 'doc.proof'
});
scalarFields.set('blocks_signatures.validator_list_hash_short', {
  type: 'number',
  path: 'doc.validator_list_hash_short'
});
scalarFields.set('blocks_signatures.catchain_seqno', {
  type: 'number',
  path: 'doc.catchain_seqno'
});
scalarFields.set('blocks_signatures.sig_weight', {
  type: 'uint64',
  path: 'doc.sig_weight'
});
scalarFields.set('blocks_signatures.signatures.node_id', {
  type: 'string',
  path: 'doc.signatures[*].node_id'
});
scalarFields.set('blocks_signatures.signatures.r', {
  type: 'string',
  path: 'doc.signatures[*].r'
});
scalarFields.set('blocks_signatures.signatures.s', {
  type: 'string',
  path: 'doc.signatures[*].s'
});
scalarFields.set('blocks.id', {
  type: 'string',
  path: 'doc._key'
});
scalarFields.set('blocks.global_id', {
  type: 'number',
  path: 'doc.global_id'
});
scalarFields.set('blocks.want_split', {
  type: 'boolean',
  path: 'doc.want_split'
});
scalarFields.set('blocks.seq_no', {
  type: 'number',
  path: 'doc.seq_no'
});
scalarFields.set('blocks.after_merge', {
  type: 'boolean',
  path: 'doc.after_merge'
});
scalarFields.set('blocks.gen_utime', {
  type: 'number',
  path: 'doc.gen_utime'
});
scalarFields.set('blocks.gen_catchain_seqno', {
  type: 'number',
  path: 'doc.gen_catchain_seqno'
});
scalarFields.set('blocks.flags', {
  type: 'number',
  path: 'doc.flags'
});
scalarFields.set('blocks.master_ref.end_lt', {
  type: 'uint64',
  path: 'doc.master_ref.end_lt'
});
scalarFields.set('blocks.master_ref.seq_no', {
  type: 'number',
  path: 'doc.master_ref.seq_no'
});
scalarFields.set('blocks.master_ref.root_hash', {
  type: 'string',
  path: 'doc.master_ref.root_hash'
});
scalarFields.set('blocks.master_ref.file_hash', {
  type: 'string',
  path: 'doc.master_ref.file_hash'
});
scalarFields.set('blocks.prev_ref.end_lt', {
  type: 'uint64',
  path: 'doc.prev_ref.end_lt'
});
scalarFields.set('blocks.prev_ref.seq_no', {
  type: 'number',
  path: 'doc.prev_ref.seq_no'
});
scalarFields.set('blocks.prev_ref.root_hash', {
  type: 'string',
  path: 'doc.prev_ref.root_hash'
});
scalarFields.set('blocks.prev_ref.file_hash', {
  type: 'string',
  path: 'doc.prev_ref.file_hash'
});
scalarFields.set('blocks.prev_alt_ref.end_lt', {
  type: 'uint64',
  path: 'doc.prev_alt_ref.end_lt'
});
scalarFields.set('blocks.prev_alt_ref.seq_no', {
  type: 'number',
  path: 'doc.prev_alt_ref.seq_no'
});
scalarFields.set('blocks.prev_alt_ref.root_hash', {
  type: 'string',
  path: 'doc.prev_alt_ref.root_hash'
});
scalarFields.set('blocks.prev_alt_ref.file_hash', {
  type: 'string',
  path: 'doc.prev_alt_ref.file_hash'
});
scalarFields.set('blocks.prev_vert_ref.end_lt', {
  type: 'uint64',
  path: 'doc.prev_vert_ref.end_lt'
});
scalarFields.set('blocks.prev_vert_ref.seq_no', {
  type: 'number',
  path: 'doc.prev_vert_ref.seq_no'
});
scalarFields.set('blocks.prev_vert_ref.root_hash', {
  type: 'string',
  path: 'doc.prev_vert_ref.root_hash'
});
scalarFields.set('blocks.prev_vert_ref.file_hash', {
  type: 'string',
  path: 'doc.prev_vert_ref.file_hash'
});
scalarFields.set('blocks.prev_vert_alt_ref.end_lt', {
  type: 'uint64',
  path: 'doc.prev_vert_alt_ref.end_lt'
});
scalarFields.set('blocks.prev_vert_alt_ref.seq_no', {
  type: 'number',
  path: 'doc.prev_vert_alt_ref.seq_no'
});
scalarFields.set('blocks.prev_vert_alt_ref.root_hash', {
  type: 'string',
  path: 'doc.prev_vert_alt_ref.root_hash'
});
scalarFields.set('blocks.prev_vert_alt_ref.file_hash', {
  type: 'string',
  path: 'doc.prev_vert_alt_ref.file_hash'
});
scalarFields.set('blocks.version', {
  type: 'number',
  path: 'doc.version'
});
scalarFields.set('blocks.gen_validator_list_hash_short', {
  type: 'number',
  path: 'doc.gen_validator_list_hash_short'
});
scalarFields.set('blocks.before_split', {
  type: 'boolean',
  path: 'doc.before_split'
});
scalarFields.set('blocks.after_split', {
  type: 'boolean',
  path: 'doc.after_split'
});
scalarFields.set('blocks.want_merge', {
  type: 'boolean',
  path: 'doc.want_merge'
});
scalarFields.set('blocks.vert_seq_no', {
  type: 'number',
  path: 'doc.vert_seq_no'
});
scalarFields.set('blocks.start_lt', {
  type: 'uint64',
  path: 'doc.start_lt'
});
scalarFields.set('blocks.end_lt', {
  type: 'uint64',
  path: 'doc.end_lt'
});
scalarFields.set('blocks.workchain_id', {
  type: 'number',
  path: 'doc.workchain_id'
});
scalarFields.set('blocks.shard', {
  type: 'string',
  path: 'doc.shard'
});
scalarFields.set('blocks.min_ref_mc_seqno', {
  type: 'number',
  path: 'doc.min_ref_mc_seqno'
});
scalarFields.set('blocks.prev_key_block_seqno', {
  type: 'number',
  path: 'doc.prev_key_block_seqno'
});
scalarFields.set('blocks.gen_software_version', {
  type: 'number',
  path: 'doc.gen_software_version'
});
scalarFields.set('blocks.gen_software_capabilities', {
  type: 'string',
  path: 'doc.gen_software_capabilities'
});
scalarFields.set('blocks.value_flow.to_next_blk', {
  type: 'uint1024',
  path: 'doc.value_flow.to_next_blk'
});
scalarFields.set('blocks.value_flow.to_next_blk_other.currency', {
  type: 'number',
  path: 'doc.value_flow.to_next_blk_other[*].currency'
});
scalarFields.set('blocks.value_flow.to_next_blk_other.value', {
  type: 'uint1024',
  path: 'doc.value_flow.to_next_blk_other[*].value'
});
scalarFields.set('blocks.value_flow.exported', {
  type: 'uint1024',
  path: 'doc.value_flow.exported'
});
scalarFields.set('blocks.value_flow.exported_other.currency', {
  type: 'number',
  path: 'doc.value_flow.exported_other[*].currency'
});
scalarFields.set('blocks.value_flow.exported_other.value', {
  type: 'uint1024',
  path: 'doc.value_flow.exported_other[*].value'
});
scalarFields.set('blocks.value_flow.fees_collected', {
  type: 'uint1024',
  path: 'doc.value_flow.fees_collected'
});
scalarFields.set('blocks.value_flow.fees_collected_other.currency', {
  type: 'number',
  path: 'doc.value_flow.fees_collected_other[*].currency'
});
scalarFields.set('blocks.value_flow.fees_collected_other.value', {
  type: 'uint1024',
  path: 'doc.value_flow.fees_collected_other[*].value'
});
scalarFields.set('blocks.value_flow.created', {
  type: 'uint1024',
  path: 'doc.value_flow.created'
});
scalarFields.set('blocks.value_flow.created_other.currency', {
  type: 'number',
  path: 'doc.value_flow.created_other[*].currency'
});
scalarFields.set('blocks.value_flow.created_other.value', {
  type: 'uint1024',
  path: 'doc.value_flow.created_other[*].value'
});
scalarFields.set('blocks.value_flow.imported', {
  type: 'uint1024',
  path: 'doc.value_flow.imported'
});
scalarFields.set('blocks.value_flow.imported_other.currency', {
  type: 'number',
  path: 'doc.value_flow.imported_other[*].currency'
});
scalarFields.set('blocks.value_flow.imported_other.value', {
  type: 'uint1024',
  path: 'doc.value_flow.imported_other[*].value'
});
scalarFields.set('blocks.value_flow.from_prev_blk', {
  type: 'uint1024',
  path: 'doc.value_flow.from_prev_blk'
});
scalarFields.set('blocks.value_flow.from_prev_blk_other.currency', {
  type: 'number',
  path: 'doc.value_flow.from_prev_blk_other[*].currency'
});
scalarFields.set('blocks.value_flow.from_prev_blk_other.value', {
  type: 'uint1024',
  path: 'doc.value_flow.from_prev_blk_other[*].value'
});
scalarFields.set('blocks.value_flow.minted', {
  type: 'uint1024',
  path: 'doc.value_flow.minted'
});
scalarFields.set('blocks.value_flow.minted_other.currency', {
  type: 'number',
  path: 'doc.value_flow.minted_other[*].currency'
});
scalarFields.set('blocks.value_flow.minted_other.value', {
  type: 'uint1024',
  path: 'doc.value_flow.minted_other[*].value'
});
scalarFields.set('blocks.value_flow.fees_imported', {
  type: 'uint1024',
  path: 'doc.value_flow.fees_imported'
});
scalarFields.set('blocks.value_flow.fees_imported_other.currency', {
  type: 'number',
  path: 'doc.value_flow.fees_imported_other[*].currency'
});
scalarFields.set('blocks.value_flow.fees_imported_other.value', {
  type: 'uint1024',
  path: 'doc.value_flow.fees_imported_other[*].value'
});
scalarFields.set('blocks.in_msg_descr.msg_id', {
  type: 'string',
  path: 'doc.in_msg_descr[*].msg_id'
});
scalarFields.set('blocks.in_msg_descr.ihr_fee', {
  type: 'uint1024',
  path: 'doc.in_msg_descr[*].ihr_fee'
});
scalarFields.set('blocks.in_msg_descr.proof_created', {
  type: 'string',
  path: 'doc.in_msg_descr[*].proof_created'
});
scalarFields.set('blocks.in_msg_descr.in_msg.msg_id', {
  type: 'string',
  path: 'doc.in_msg_descr[*].in_msg.msg_id'
});
scalarFields.set('blocks.in_msg_descr.in_msg.next_addr', {
  type: 'string',
  path: 'doc.in_msg_descr[*].in_msg.next_addr'
});
scalarFields.set('blocks.in_msg_descr.in_msg.cur_addr', {
  type: 'string',
  path: 'doc.in_msg_descr[*].in_msg.cur_addr'
});
scalarFields.set('blocks.in_msg_descr.in_msg.fwd_fee_remaining', {
  type: 'uint1024',
  path: 'doc.in_msg_descr[*].in_msg.fwd_fee_remaining'
});
scalarFields.set('blocks.in_msg_descr.fwd_fee', {
  type: 'uint1024',
  path: 'doc.in_msg_descr[*].fwd_fee'
});
scalarFields.set('blocks.in_msg_descr.out_msg.msg_id', {
  type: 'string',
  path: 'doc.in_msg_descr[*].out_msg.msg_id'
});
scalarFields.set('blocks.in_msg_descr.out_msg.next_addr', {
  type: 'string',
  path: 'doc.in_msg_descr[*].out_msg.next_addr'
});
scalarFields.set('blocks.in_msg_descr.out_msg.cur_addr', {
  type: 'string',
  path: 'doc.in_msg_descr[*].out_msg.cur_addr'
});
scalarFields.set('blocks.in_msg_descr.out_msg.fwd_fee_remaining', {
  type: 'uint1024',
  path: 'doc.in_msg_descr[*].out_msg.fwd_fee_remaining'
});
scalarFields.set('blocks.in_msg_descr.transit_fee', {
  type: 'uint1024',
  path: 'doc.in_msg_descr[*].transit_fee'
});
scalarFields.set('blocks.in_msg_descr.transaction_id', {
  type: 'string',
  path: 'doc.in_msg_descr[*].transaction_id'
});
scalarFields.set('blocks.in_msg_descr.proof_delivered', {
  type: 'string',
  path: 'doc.in_msg_descr[*].proof_delivered'
});
scalarFields.set('blocks.rand_seed', {
  type: 'string',
  path: 'doc.rand_seed'
});
scalarFields.set('blocks.out_msg_descr.msg_id', {
  type: 'string',
  path: 'doc.out_msg_descr[*].msg_id'
});
scalarFields.set('blocks.out_msg_descr.transaction_id', {
  type: 'string',
  path: 'doc.out_msg_descr[*].transaction_id'
});
scalarFields.set('blocks.out_msg_descr.out_msg.msg_id', {
  type: 'string',
  path: 'doc.out_msg_descr[*].out_msg.msg_id'
});
scalarFields.set('blocks.out_msg_descr.out_msg.next_addr', {
  type: 'string',
  path: 'doc.out_msg_descr[*].out_msg.next_addr'
});
scalarFields.set('blocks.out_msg_descr.out_msg.cur_addr', {
  type: 'string',
  path: 'doc.out_msg_descr[*].out_msg.cur_addr'
});
scalarFields.set('blocks.out_msg_descr.out_msg.fwd_fee_remaining', {
  type: 'uint1024',
  path: 'doc.out_msg_descr[*].out_msg.fwd_fee_remaining'
});
scalarFields.set('blocks.out_msg_descr.reimport.msg_id', {
  type: 'string',
  path: 'doc.out_msg_descr[*].reimport.msg_id'
});
scalarFields.set('blocks.out_msg_descr.reimport.ihr_fee', {
  type: 'uint1024',
  path: 'doc.out_msg_descr[*].reimport.ihr_fee'
});
scalarFields.set('blocks.out_msg_descr.reimport.proof_created', {
  type: 'string',
  path: 'doc.out_msg_descr[*].reimport.proof_created'
});
scalarFields.set('blocks.out_msg_descr.reimport.in_msg.msg_id', {
  type: 'string',
  path: 'doc.out_msg_descr[*].reimport.in_msg.msg_id'
});
scalarFields.set('blocks.out_msg_descr.reimport.in_msg.next_addr', {
  type: 'string',
  path: 'doc.out_msg_descr[*].reimport.in_msg.next_addr'
});
scalarFields.set('blocks.out_msg_descr.reimport.in_msg.cur_addr', {
  type: 'string',
  path: 'doc.out_msg_descr[*].reimport.in_msg.cur_addr'
});
scalarFields.set('blocks.out_msg_descr.reimport.in_msg.fwd_fee_remaining', {
  type: 'uint1024',
  path: 'doc.out_msg_descr[*].reimport.in_msg.fwd_fee_remaining'
});
scalarFields.set('blocks.out_msg_descr.reimport.fwd_fee', {
  type: 'uint1024',
  path: 'doc.out_msg_descr[*].reimport.fwd_fee'
});
scalarFields.set('blocks.out_msg_descr.reimport.out_msg.msg_id', {
  type: 'string',
  path: 'doc.out_msg_descr[*].reimport.out_msg.msg_id'
});
scalarFields.set('blocks.out_msg_descr.reimport.out_msg.next_addr', {
  type: 'string',
  path: 'doc.out_msg_descr[*].reimport.out_msg.next_addr'
});
scalarFields.set('blocks.out_msg_descr.reimport.out_msg.cur_addr', {
  type: 'string',
  path: 'doc.out_msg_descr[*].reimport.out_msg.cur_addr'
});
scalarFields.set('blocks.out_msg_descr.reimport.out_msg.fwd_fee_remaining', {
  type: 'uint1024',
  path: 'doc.out_msg_descr[*].reimport.out_msg.fwd_fee_remaining'
});
scalarFields.set('blocks.out_msg_descr.reimport.transit_fee', {
  type: 'uint1024',
  path: 'doc.out_msg_descr[*].reimport.transit_fee'
});
scalarFields.set('blocks.out_msg_descr.reimport.transaction_id', {
  type: 'string',
  path: 'doc.out_msg_descr[*].reimport.transaction_id'
});
scalarFields.set('blocks.out_msg_descr.reimport.proof_delivered', {
  type: 'string',
  path: 'doc.out_msg_descr[*].reimport.proof_delivered'
});
scalarFields.set('blocks.out_msg_descr.imported.msg_id', {
  type: 'string',
  path: 'doc.out_msg_descr[*].imported.msg_id'
});
scalarFields.set('blocks.out_msg_descr.imported.ihr_fee', {
  type: 'uint1024',
  path: 'doc.out_msg_descr[*].imported.ihr_fee'
});
scalarFields.set('blocks.out_msg_descr.imported.proof_created', {
  type: 'string',
  path: 'doc.out_msg_descr[*].imported.proof_created'
});
scalarFields.set('blocks.out_msg_descr.imported.in_msg.msg_id', {
  type: 'string',
  path: 'doc.out_msg_descr[*].imported.in_msg.msg_id'
});
scalarFields.set('blocks.out_msg_descr.imported.in_msg.next_addr', {
  type: 'string',
  path: 'doc.out_msg_descr[*].imported.in_msg.next_addr'
});
scalarFields.set('blocks.out_msg_descr.imported.in_msg.cur_addr', {
  type: 'string',
  path: 'doc.out_msg_descr[*].imported.in_msg.cur_addr'
});
scalarFields.set('blocks.out_msg_descr.imported.in_msg.fwd_fee_remaining', {
  type: 'uint1024',
  path: 'doc.out_msg_descr[*].imported.in_msg.fwd_fee_remaining'
});
scalarFields.set('blocks.out_msg_descr.imported.fwd_fee', {
  type: 'uint1024',
  path: 'doc.out_msg_descr[*].imported.fwd_fee'
});
scalarFields.set('blocks.out_msg_descr.imported.out_msg.msg_id', {
  type: 'string',
  path: 'doc.out_msg_descr[*].imported.out_msg.msg_id'
});
scalarFields.set('blocks.out_msg_descr.imported.out_msg.next_addr', {
  type: 'string',
  path: 'doc.out_msg_descr[*].imported.out_msg.next_addr'
});
scalarFields.set('blocks.out_msg_descr.imported.out_msg.cur_addr', {
  type: 'string',
  path: 'doc.out_msg_descr[*].imported.out_msg.cur_addr'
});
scalarFields.set('blocks.out_msg_descr.imported.out_msg.fwd_fee_remaining', {
  type: 'uint1024',
  path: 'doc.out_msg_descr[*].imported.out_msg.fwd_fee_remaining'
});
scalarFields.set('blocks.out_msg_descr.imported.transit_fee', {
  type: 'uint1024',
  path: 'doc.out_msg_descr[*].imported.transit_fee'
});
scalarFields.set('blocks.out_msg_descr.imported.transaction_id', {
  type: 'string',
  path: 'doc.out_msg_descr[*].imported.transaction_id'
});
scalarFields.set('blocks.out_msg_descr.imported.proof_delivered', {
  type: 'string',
  path: 'doc.out_msg_descr[*].imported.proof_delivered'
});
scalarFields.set('blocks.out_msg_descr.import_block_lt', {
  type: 'uint64',
  path: 'doc.out_msg_descr[*].import_block_lt'
});
scalarFields.set('blocks.out_msg_descr.msg_env_hash', {
  type: 'string',
  path: 'doc.out_msg_descr[*].msg_env_hash'
});
scalarFields.set('blocks.out_msg_descr.next_workchain', {
  type: 'number',
  path: 'doc.out_msg_descr[*].next_workchain'
});
scalarFields.set('blocks.out_msg_descr.next_addr_pfx', {
  type: 'uint64',
  path: 'doc.out_msg_descr[*].next_addr_pfx'
});
scalarFields.set('blocks.account_blocks.account_addr', {
  type: 'string',
  path: 'doc.account_blocks[*].account_addr'
});
scalarFields.set('blocks.account_blocks.transactions.lt', {
  type: 'uint64',
  path: 'doc.account_blocks[*].transactions[**].lt'
});
scalarFields.set('blocks.account_blocks.transactions.transaction_id', {
  type: 'string',
  path: 'doc.account_blocks[*].transactions[**].transaction_id'
});
scalarFields.set('blocks.account_blocks.transactions.total_fees', {
  type: 'uint1024',
  path: 'doc.account_blocks[*].transactions[**].total_fees'
});
scalarFields.set('blocks.account_blocks.transactions.total_fees_other.currency', {
  type: 'number',
  path: 'doc.account_blocks[*].transactions[**].total_fees_other[***].currency'
});
scalarFields.set('blocks.account_blocks.transactions.total_fees_other.value', {
  type: 'uint1024',
  path: 'doc.account_blocks[*].transactions[**].total_fees_other[***].value'
});
scalarFields.set('blocks.account_blocks.old_hash', {
  type: 'string',
  path: 'doc.account_blocks[*].old_hash'
});
scalarFields.set('blocks.account_blocks.new_hash', {
  type: 'string',
  path: 'doc.account_blocks[*].new_hash'
});
scalarFields.set('blocks.account_blocks.tr_count', {
  type: 'number',
  path: 'doc.account_blocks[*].tr_count'
});
scalarFields.set('blocks.tr_count', {
  type: 'number',
  path: 'doc.tr_count'
});
scalarFields.set('blocks.state_update.new', {
  type: 'string',
  path: 'doc.state_update.new'
});
scalarFields.set('blocks.state_update.new_hash', {
  type: 'string',
  path: 'doc.state_update.new_hash'
});
scalarFields.set('blocks.state_update.new_depth', {
  type: 'number',
  path: 'doc.state_update.new_depth'
});
scalarFields.set('blocks.state_update.old', {
  type: 'string',
  path: 'doc.state_update.old'
});
scalarFields.set('blocks.state_update.old_hash', {
  type: 'string',
  path: 'doc.state_update.old_hash'
});
scalarFields.set('blocks.state_update.old_depth', {
  type: 'number',
  path: 'doc.state_update.old_depth'
});
scalarFields.set('blocks.master.min_shard_gen_utime', {
  type: 'number',
  path: 'doc.master.min_shard_gen_utime'
});
scalarFields.set('blocks.master.max_shard_gen_utime', {
  type: 'number',
  path: 'doc.master.max_shard_gen_utime'
});
scalarFields.set('blocks.master.shard_hashes.workchain_id', {
  type: 'number',
  path: 'doc.master.shard_hashes[*].workchain_id'
});
scalarFields.set('blocks.master.shard_hashes.shard', {
  type: 'string',
  path: 'doc.master.shard_hashes[*].shard'
});
scalarFields.set('blocks.master.shard_hashes.descr.seq_no', {
  type: 'number',
  path: 'doc.master.shard_hashes[*].descr.seq_no'
});
scalarFields.set('blocks.master.shard_hashes.descr.reg_mc_seqno', {
  type: 'number',
  path: 'doc.master.shard_hashes[*].descr.reg_mc_seqno'
});
scalarFields.set('blocks.master.shard_hashes.descr.start_lt', {
  type: 'uint64',
  path: 'doc.master.shard_hashes[*].descr.start_lt'
});
scalarFields.set('blocks.master.shard_hashes.descr.end_lt', {
  type: 'uint64',
  path: 'doc.master.shard_hashes[*].descr.end_lt'
});
scalarFields.set('blocks.master.shard_hashes.descr.root_hash', {
  type: 'string',
  path: 'doc.master.shard_hashes[*].descr.root_hash'
});
scalarFields.set('blocks.master.shard_hashes.descr.file_hash', {
  type: 'string',
  path: 'doc.master.shard_hashes[*].descr.file_hash'
});
scalarFields.set('blocks.master.shard_hashes.descr.before_split', {
  type: 'boolean',
  path: 'doc.master.shard_hashes[*].descr.before_split'
});
scalarFields.set('blocks.master.shard_hashes.descr.before_merge', {
  type: 'boolean',
  path: 'doc.master.shard_hashes[*].descr.before_merge'
});
scalarFields.set('blocks.master.shard_hashes.descr.want_split', {
  type: 'boolean',
  path: 'doc.master.shard_hashes[*].descr.want_split'
});
scalarFields.set('blocks.master.shard_hashes.descr.want_merge', {
  type: 'boolean',
  path: 'doc.master.shard_hashes[*].descr.want_merge'
});
scalarFields.set('blocks.master.shard_hashes.descr.nx_cc_updated', {
  type: 'boolean',
  path: 'doc.master.shard_hashes[*].descr.nx_cc_updated'
});
scalarFields.set('blocks.master.shard_hashes.descr.flags', {
  type: 'number',
  path: 'doc.master.shard_hashes[*].descr.flags'
});
scalarFields.set('blocks.master.shard_hashes.descr.next_catchain_seqno', {
  type: 'number',
  path: 'doc.master.shard_hashes[*].descr.next_catchain_seqno'
});
scalarFields.set('blocks.master.shard_hashes.descr.next_validator_shard', {
  type: 'string',
  path: 'doc.master.shard_hashes[*].descr.next_validator_shard'
});
scalarFields.set('blocks.master.shard_hashes.descr.min_ref_mc_seqno', {
  type: 'number',
  path: 'doc.master.shard_hashes[*].descr.min_ref_mc_seqno'
});
scalarFields.set('blocks.master.shard_hashes.descr.gen_utime', {
  type: 'number',
  path: 'doc.master.shard_hashes[*].descr.gen_utime'
});
scalarFields.set('blocks.master.shard_hashes.descr.split', {
  type: 'number',
  path: 'doc.master.shard_hashes[*].descr.split'
});
scalarFields.set('blocks.master.shard_hashes.descr.fees_collected', {
  type: 'uint1024',
  path: 'doc.master.shard_hashes[*].descr.fees_collected'
});
scalarFields.set('blocks.master.shard_hashes.descr.fees_collected_other.currency', {
  type: 'number',
  path: 'doc.master.shard_hashes[*].descr.fees_collected_other[**].currency'
});
scalarFields.set('blocks.master.shard_hashes.descr.fees_collected_other.value', {
  type: 'uint1024',
  path: 'doc.master.shard_hashes[*].descr.fees_collected_other[**].value'
});
scalarFields.set('blocks.master.shard_hashes.descr.funds_created', {
  type: 'uint1024',
  path: 'doc.master.shard_hashes[*].descr.funds_created'
});
scalarFields.set('blocks.master.shard_hashes.descr.funds_created_other.currency', {
  type: 'number',
  path: 'doc.master.shard_hashes[*].descr.funds_created_other[**].currency'
});
scalarFields.set('blocks.master.shard_hashes.descr.funds_created_other.value', {
  type: 'uint1024',
  path: 'doc.master.shard_hashes[*].descr.funds_created_other[**].value'
});
scalarFields.set('blocks.master.shard_fees.workchain_id', {
  type: 'number',
  path: 'doc.master.shard_fees[*].workchain_id'
});
scalarFields.set('blocks.master.shard_fees.shard', {
  type: 'string',
  path: 'doc.master.shard_fees[*].shard'
});
scalarFields.set('blocks.master.shard_fees.fees', {
  type: 'uint1024',
  path: 'doc.master.shard_fees[*].fees'
});
scalarFields.set('blocks.master.shard_fees.fees_other.currency', {
  type: 'number',
  path: 'doc.master.shard_fees[*].fees_other[**].currency'
});
scalarFields.set('blocks.master.shard_fees.fees_other.value', {
  type: 'uint1024',
  path: 'doc.master.shard_fees[*].fees_other[**].value'
});
scalarFields.set('blocks.master.shard_fees.create', {
  type: 'uint1024',
  path: 'doc.master.shard_fees[*].create'
});
scalarFields.set('blocks.master.shard_fees.create_other.currency', {
  type: 'number',
  path: 'doc.master.shard_fees[*].create_other[**].currency'
});
scalarFields.set('blocks.master.shard_fees.create_other.value', {
  type: 'uint1024',
  path: 'doc.master.shard_fees[*].create_other[**].value'
});
scalarFields.set('blocks.master.recover_create_msg.msg_id', {
  type: 'string',
  path: 'doc.master.recover_create_msg.msg_id'
});
scalarFields.set('blocks.master.recover_create_msg.ihr_fee', {
  type: 'uint1024',
  path: 'doc.master.recover_create_msg.ihr_fee'
});
scalarFields.set('blocks.master.recover_create_msg.proof_created', {
  type: 'string',
  path: 'doc.master.recover_create_msg.proof_created'
});
scalarFields.set('blocks.master.recover_create_msg.in_msg.msg_id', {
  type: 'string',
  path: 'doc.master.recover_create_msg.in_msg.msg_id'
});
scalarFields.set('blocks.master.recover_create_msg.in_msg.next_addr', {
  type: 'string',
  path: 'doc.master.recover_create_msg.in_msg.next_addr'
});
scalarFields.set('blocks.master.recover_create_msg.in_msg.cur_addr', {
  type: 'string',
  path: 'doc.master.recover_create_msg.in_msg.cur_addr'
});
scalarFields.set('blocks.master.recover_create_msg.in_msg.fwd_fee_remaining', {
  type: 'uint1024',
  path: 'doc.master.recover_create_msg.in_msg.fwd_fee_remaining'
});
scalarFields.set('blocks.master.recover_create_msg.fwd_fee', {
  type: 'uint1024',
  path: 'doc.master.recover_create_msg.fwd_fee'
});
scalarFields.set('blocks.master.recover_create_msg.out_msg.msg_id', {
  type: 'string',
  path: 'doc.master.recover_create_msg.out_msg.msg_id'
});
scalarFields.set('blocks.master.recover_create_msg.out_msg.next_addr', {
  type: 'string',
  path: 'doc.master.recover_create_msg.out_msg.next_addr'
});
scalarFields.set('blocks.master.recover_create_msg.out_msg.cur_addr', {
  type: 'string',
  path: 'doc.master.recover_create_msg.out_msg.cur_addr'
});
scalarFields.set('blocks.master.recover_create_msg.out_msg.fwd_fee_remaining', {
  type: 'uint1024',
  path: 'doc.master.recover_create_msg.out_msg.fwd_fee_remaining'
});
scalarFields.set('blocks.master.recover_create_msg.transit_fee', {
  type: 'uint1024',
  path: 'doc.master.recover_create_msg.transit_fee'
});
scalarFields.set('blocks.master.recover_create_msg.transaction_id', {
  type: 'string',
  path: 'doc.master.recover_create_msg.transaction_id'
});
scalarFields.set('blocks.master.recover_create_msg.proof_delivered', {
  type: 'string',
  path: 'doc.master.recover_create_msg.proof_delivered'
});
scalarFields.set('blocks.master.prev_blk_signatures.node_id', {
  type: 'string',
  path: 'doc.master.prev_blk_signatures[*].node_id'
});
scalarFields.set('blocks.master.prev_blk_signatures.r', {
  type: 'string',
  path: 'doc.master.prev_blk_signatures[*].r'
});
scalarFields.set('blocks.master.prev_blk_signatures.s', {
  type: 'string',
  path: 'doc.master.prev_blk_signatures[*].s'
});
scalarFields.set('blocks.master.config_addr', {
  type: 'string',
  path: 'doc.master.config_addr'
});
scalarFields.set('blocks.master.config.p0', {
  type: 'string',
  path: 'doc.master.config.p0'
});
scalarFields.set('blocks.master.config.p1', {
  type: 'string',
  path: 'doc.master.config.p1'
});
scalarFields.set('blocks.master.config.p2', {
  type: 'string',
  path: 'doc.master.config.p2'
});
scalarFields.set('blocks.master.config.p3', {
  type: 'string',
  path: 'doc.master.config.p3'
});
scalarFields.set('blocks.master.config.p4', {
  type: 'string',
  path: 'doc.master.config.p4'
});
scalarFields.set('blocks.master.config.p6.mint_new_price', {
  type: 'string',
  path: 'doc.master.config.p6.mint_new_price'
});
scalarFields.set('blocks.master.config.p6.mint_add_price', {
  type: 'string',
  path: 'doc.master.config.p6.mint_add_price'
});
scalarFields.set('blocks.master.config.p7.currency', {
  type: 'number',
  path: 'doc.master.config.p7[*].currency'
});
scalarFields.set('blocks.master.config.p7.value', {
  type: 'string',
  path: 'doc.master.config.p7[*].value'
});
scalarFields.set('blocks.master.config.p8.version', {
  type: 'number',
  path: 'doc.master.config.p8.version'
});
scalarFields.set('blocks.master.config.p8.capabilities', {
  type: 'string',
  path: 'doc.master.config.p8.capabilities'
});
scalarFields.set('blocks.master.config.p9', {
  type: 'number',
  path: 'doc.master.config.p9[*]'
});
scalarFields.set('blocks.master.config.p10', {
  type: 'number',
  path: 'doc.master.config.p10[*]'
});
scalarFields.set('blocks.master.config.p11.normal_params.min_tot_rounds', {
  type: 'number',
  path: 'doc.master.config.p11.normal_params.min_tot_rounds'
});
scalarFields.set('blocks.master.config.p11.normal_params.max_tot_rounds', {
  type: 'number',
  path: 'doc.master.config.p11.normal_params.max_tot_rounds'
});
scalarFields.set('blocks.master.config.p11.normal_params.min_wins', {
  type: 'number',
  path: 'doc.master.config.p11.normal_params.min_wins'
});
scalarFields.set('blocks.master.config.p11.normal_params.max_losses', {
  type: 'number',
  path: 'doc.master.config.p11.normal_params.max_losses'
});
scalarFields.set('blocks.master.config.p11.normal_params.min_store_sec', {
  type: 'number',
  path: 'doc.master.config.p11.normal_params.min_store_sec'
});
scalarFields.set('blocks.master.config.p11.normal_params.max_store_sec', {
  type: 'number',
  path: 'doc.master.config.p11.normal_params.max_store_sec'
});
scalarFields.set('blocks.master.config.p11.normal_params.bit_price', {
  type: 'number',
  path: 'doc.master.config.p11.normal_params.bit_price'
});
scalarFields.set('blocks.master.config.p11.normal_params.cell_price', {
  type: 'number',
  path: 'doc.master.config.p11.normal_params.cell_price'
});
scalarFields.set('blocks.master.config.p11.critical_params.min_tot_rounds', {
  type: 'number',
  path: 'doc.master.config.p11.critical_params.min_tot_rounds'
});
scalarFields.set('blocks.master.config.p11.critical_params.max_tot_rounds', {
  type: 'number',
  path: 'doc.master.config.p11.critical_params.max_tot_rounds'
});
scalarFields.set('blocks.master.config.p11.critical_params.min_wins', {
  type: 'number',
  path: 'doc.master.config.p11.critical_params.min_wins'
});
scalarFields.set('blocks.master.config.p11.critical_params.max_losses', {
  type: 'number',
  path: 'doc.master.config.p11.critical_params.max_losses'
});
scalarFields.set('blocks.master.config.p11.critical_params.min_store_sec', {
  type: 'number',
  path: 'doc.master.config.p11.critical_params.min_store_sec'
});
scalarFields.set('blocks.master.config.p11.critical_params.max_store_sec', {
  type: 'number',
  path: 'doc.master.config.p11.critical_params.max_store_sec'
});
scalarFields.set('blocks.master.config.p11.critical_params.bit_price', {
  type: 'number',
  path: 'doc.master.config.p11.critical_params.bit_price'
});
scalarFields.set('blocks.master.config.p11.critical_params.cell_price', {
  type: 'number',
  path: 'doc.master.config.p11.critical_params.cell_price'
});
scalarFields.set('blocks.master.config.p12.workchain_id', {
  type: 'number',
  path: 'doc.master.config.p12[*].workchain_id'
});
scalarFields.set('blocks.master.config.p12.enabled_since', {
  type: 'number',
  path: 'doc.master.config.p12[*].enabled_since'
});
scalarFields.set('blocks.master.config.p12.actual_min_split', {
  type: 'number',
  path: 'doc.master.config.p12[*].actual_min_split'
});
scalarFields.set('blocks.master.config.p12.min_split', {
  type: 'number',
  path: 'doc.master.config.p12[*].min_split'
});
scalarFields.set('blocks.master.config.p12.max_split', {
  type: 'number',
  path: 'doc.master.config.p12[*].max_split'
});
scalarFields.set('blocks.master.config.p12.active', {
  type: 'boolean',
  path: 'doc.master.config.p12[*].active'
});
scalarFields.set('blocks.master.config.p12.accept_msgs', {
  type: 'boolean',
  path: 'doc.master.config.p12[*].accept_msgs'
});
scalarFields.set('blocks.master.config.p12.flags', {
  type: 'number',
  path: 'doc.master.config.p12[*].flags'
});
scalarFields.set('blocks.master.config.p12.zerostate_root_hash', {
  type: 'string',
  path: 'doc.master.config.p12[*].zerostate_root_hash'
});
scalarFields.set('blocks.master.config.p12.zerostate_file_hash', {
  type: 'string',
  path: 'doc.master.config.p12[*].zerostate_file_hash'
});
scalarFields.set('blocks.master.config.p12.version', {
  type: 'number',
  path: 'doc.master.config.p12[*].version'
});
scalarFields.set('blocks.master.config.p12.basic', {
  type: 'boolean',
  path: 'doc.master.config.p12[*].basic'
});
scalarFields.set('blocks.master.config.p12.vm_version', {
  type: 'number',
  path: 'doc.master.config.p12[*].vm_version'
});
scalarFields.set('blocks.master.config.p12.vm_mode', {
  type: 'string',
  path: 'doc.master.config.p12[*].vm_mode'
});
scalarFields.set('blocks.master.config.p12.min_addr_len', {
  type: 'number',
  path: 'doc.master.config.p12[*].min_addr_len'
});
scalarFields.set('blocks.master.config.p12.max_addr_len', {
  type: 'number',
  path: 'doc.master.config.p12[*].max_addr_len'
});
scalarFields.set('blocks.master.config.p12.addr_len_step', {
  type: 'number',
  path: 'doc.master.config.p12[*].addr_len_step'
});
scalarFields.set('blocks.master.config.p12.workchain_type_id', {
  type: 'number',
  path: 'doc.master.config.p12[*].workchain_type_id'
});
scalarFields.set('blocks.master.config.p14.masterchain_block_fee', {
  type: 'uint1024',
  path: 'doc.master.config.p14.masterchain_block_fee'
});
scalarFields.set('blocks.master.config.p14.basechain_block_fee', {
  type: 'uint1024',
  path: 'doc.master.config.p14.basechain_block_fee'
});
scalarFields.set('blocks.master.config.p15.validators_elected_for', {
  type: 'number',
  path: 'doc.master.config.p15.validators_elected_for'
});
scalarFields.set('blocks.master.config.p15.elections_start_before', {
  type: 'number',
  path: 'doc.master.config.p15.elections_start_before'
});
scalarFields.set('blocks.master.config.p15.elections_end_before', {
  type: 'number',
  path: 'doc.master.config.p15.elections_end_before'
});
scalarFields.set('blocks.master.config.p15.stake_held_for', {
  type: 'number',
  path: 'doc.master.config.p15.stake_held_for'
});
scalarFields.set('blocks.master.config.p16.max_validators', {
  type: 'number',
  path: 'doc.master.config.p16.max_validators'
});
scalarFields.set('blocks.master.config.p16.max_main_validators', {
  type: 'number',
  path: 'doc.master.config.p16.max_main_validators'
});
scalarFields.set('blocks.master.config.p16.min_validators', {
  type: 'number',
  path: 'doc.master.config.p16.min_validators'
});
scalarFields.set('blocks.master.config.p17.min_stake', {
  type: 'uint1024',
  path: 'doc.master.config.p17.min_stake'
});
scalarFields.set('blocks.master.config.p17.max_stake', {
  type: 'uint1024',
  path: 'doc.master.config.p17.max_stake'
});
scalarFields.set('blocks.master.config.p17.min_total_stake', {
  type: 'uint1024',
  path: 'doc.master.config.p17.min_total_stake'
});
scalarFields.set('blocks.master.config.p17.max_stake_factor', {
  type: 'number',
  path: 'doc.master.config.p17.max_stake_factor'
});
scalarFields.set('blocks.master.config.p18.utime_since', {
  type: 'number',
  path: 'doc.master.config.p18[*].utime_since'
});
scalarFields.set('blocks.master.config.p18.bit_price_ps', {
  type: 'uint64',
  path: 'doc.master.config.p18[*].bit_price_ps'
});
scalarFields.set('blocks.master.config.p18.cell_price_ps', {
  type: 'uint64',
  path: 'doc.master.config.p18[*].cell_price_ps'
});
scalarFields.set('blocks.master.config.p18.mc_bit_price_ps', {
  type: 'uint64',
  path: 'doc.master.config.p18[*].mc_bit_price_ps'
});
scalarFields.set('blocks.master.config.p18.mc_cell_price_ps', {
  type: 'uint64',
  path: 'doc.master.config.p18[*].mc_cell_price_ps'
});
scalarFields.set('blocks.master.config.p20.gas_price', {
  type: 'uint64',
  path: 'doc.master.config.p20.gas_price'
});
scalarFields.set('blocks.master.config.p20.gas_limit', {
  type: 'uint64',
  path: 'doc.master.config.p20.gas_limit'
});
scalarFields.set('blocks.master.config.p20.special_gas_limit', {
  type: 'uint64',
  path: 'doc.master.config.p20.special_gas_limit'
});
scalarFields.set('blocks.master.config.p20.gas_credit', {
  type: 'uint64',
  path: 'doc.master.config.p20.gas_credit'
});
scalarFields.set('blocks.master.config.p20.block_gas_limit', {
  type: 'uint64',
  path: 'doc.master.config.p20.block_gas_limit'
});
scalarFields.set('blocks.master.config.p20.freeze_due_limit', {
  type: 'uint64',
  path: 'doc.master.config.p20.freeze_due_limit'
});
scalarFields.set('blocks.master.config.p20.delete_due_limit', {
  type: 'uint64',
  path: 'doc.master.config.p20.delete_due_limit'
});
scalarFields.set('blocks.master.config.p20.flat_gas_limit', {
  type: 'uint64',
  path: 'doc.master.config.p20.flat_gas_limit'
});
scalarFields.set('blocks.master.config.p20.flat_gas_price', {
  type: 'uint64',
  path: 'doc.master.config.p20.flat_gas_price'
});
scalarFields.set('blocks.master.config.p21.gas_price', {
  type: 'uint64',
  path: 'doc.master.config.p21.gas_price'
});
scalarFields.set('blocks.master.config.p21.gas_limit', {
  type: 'uint64',
  path: 'doc.master.config.p21.gas_limit'
});
scalarFields.set('blocks.master.config.p21.special_gas_limit', {
  type: 'uint64',
  path: 'doc.master.config.p21.special_gas_limit'
});
scalarFields.set('blocks.master.config.p21.gas_credit', {
  type: 'uint64',
  path: 'doc.master.config.p21.gas_credit'
});
scalarFields.set('blocks.master.config.p21.block_gas_limit', {
  type: 'uint64',
  path: 'doc.master.config.p21.block_gas_limit'
});
scalarFields.set('blocks.master.config.p21.freeze_due_limit', {
  type: 'uint64',
  path: 'doc.master.config.p21.freeze_due_limit'
});
scalarFields.set('blocks.master.config.p21.delete_due_limit', {
  type: 'uint64',
  path: 'doc.master.config.p21.delete_due_limit'
});
scalarFields.set('blocks.master.config.p21.flat_gas_limit', {
  type: 'uint64',
  path: 'doc.master.config.p21.flat_gas_limit'
});
scalarFields.set('blocks.master.config.p21.flat_gas_price', {
  type: 'uint64',
  path: 'doc.master.config.p21.flat_gas_price'
});
scalarFields.set('blocks.master.config.p22.bytes.underload', {
  type: 'number',
  path: 'doc.master.config.p22.bytes.underload'
});
scalarFields.set('blocks.master.config.p22.bytes.soft_limit', {
  type: 'number',
  path: 'doc.master.config.p22.bytes.soft_limit'
});
scalarFields.set('blocks.master.config.p22.bytes.hard_limit', {
  type: 'number',
  path: 'doc.master.config.p22.bytes.hard_limit'
});
scalarFields.set('blocks.master.config.p22.gas.underload', {
  type: 'number',
  path: 'doc.master.config.p22.gas.underload'
});
scalarFields.set('blocks.master.config.p22.gas.soft_limit', {
  type: 'number',
  path: 'doc.master.config.p22.gas.soft_limit'
});
scalarFields.set('blocks.master.config.p22.gas.hard_limit', {
  type: 'number',
  path: 'doc.master.config.p22.gas.hard_limit'
});
scalarFields.set('blocks.master.config.p22.lt_delta.underload', {
  type: 'number',
  path: 'doc.master.config.p22.lt_delta.underload'
});
scalarFields.set('blocks.master.config.p22.lt_delta.soft_limit', {
  type: 'number',
  path: 'doc.master.config.p22.lt_delta.soft_limit'
});
scalarFields.set('blocks.master.config.p22.lt_delta.hard_limit', {
  type: 'number',
  path: 'doc.master.config.p22.lt_delta.hard_limit'
});
scalarFields.set('blocks.master.config.p23.bytes.underload', {
  type: 'number',
  path: 'doc.master.config.p23.bytes.underload'
});
scalarFields.set('blocks.master.config.p23.bytes.soft_limit', {
  type: 'number',
  path: 'doc.master.config.p23.bytes.soft_limit'
});
scalarFields.set('blocks.master.config.p23.bytes.hard_limit', {
  type: 'number',
  path: 'doc.master.config.p23.bytes.hard_limit'
});
scalarFields.set('blocks.master.config.p23.gas.underload', {
  type: 'number',
  path: 'doc.master.config.p23.gas.underload'
});
scalarFields.set('blocks.master.config.p23.gas.soft_limit', {
  type: 'number',
  path: 'doc.master.config.p23.gas.soft_limit'
});
scalarFields.set('blocks.master.config.p23.gas.hard_limit', {
  type: 'number',
  path: 'doc.master.config.p23.gas.hard_limit'
});
scalarFields.set('blocks.master.config.p23.lt_delta.underload', {
  type: 'number',
  path: 'doc.master.config.p23.lt_delta.underload'
});
scalarFields.set('blocks.master.config.p23.lt_delta.soft_limit', {
  type: 'number',
  path: 'doc.master.config.p23.lt_delta.soft_limit'
});
scalarFields.set('blocks.master.config.p23.lt_delta.hard_limit', {
  type: 'number',
  path: 'doc.master.config.p23.lt_delta.hard_limit'
});
scalarFields.set('blocks.master.config.p24.lump_price', {
  type: 'uint64',
  path: 'doc.master.config.p24.lump_price'
});
scalarFields.set('blocks.master.config.p24.bit_price', {
  type: 'uint64',
  path: 'doc.master.config.p24.bit_price'
});
scalarFields.set('blocks.master.config.p24.cell_price', {
  type: 'uint64',
  path: 'doc.master.config.p24.cell_price'
});
scalarFields.set('blocks.master.config.p24.ihr_price_factor', {
  type: 'number',
  path: 'doc.master.config.p24.ihr_price_factor'
});
scalarFields.set('blocks.master.config.p24.first_frac', {
  type: 'number',
  path: 'doc.master.config.p24.first_frac'
});
scalarFields.set('blocks.master.config.p24.next_frac', {
  type: 'number',
  path: 'doc.master.config.p24.next_frac'
});
scalarFields.set('blocks.master.config.p25.lump_price', {
  type: 'uint64',
  path: 'doc.master.config.p25.lump_price'
});
scalarFields.set('blocks.master.config.p25.bit_price', {
  type: 'uint64',
  path: 'doc.master.config.p25.bit_price'
});
scalarFields.set('blocks.master.config.p25.cell_price', {
  type: 'uint64',
  path: 'doc.master.config.p25.cell_price'
});
scalarFields.set('blocks.master.config.p25.ihr_price_factor', {
  type: 'number',
  path: 'doc.master.config.p25.ihr_price_factor'
});
scalarFields.set('blocks.master.config.p25.first_frac', {
  type: 'number',
  path: 'doc.master.config.p25.first_frac'
});
scalarFields.set('blocks.master.config.p25.next_frac', {
  type: 'number',
  path: 'doc.master.config.p25.next_frac'
});
scalarFields.set('blocks.master.config.p28.shuffle_mc_validators', {
  type: 'boolean',
  path: 'doc.master.config.p28.shuffle_mc_validators'
});
scalarFields.set('blocks.master.config.p28.mc_catchain_lifetime', {
  type: 'number',
  path: 'doc.master.config.p28.mc_catchain_lifetime'
});
scalarFields.set('blocks.master.config.p28.shard_catchain_lifetime', {
  type: 'number',
  path: 'doc.master.config.p28.shard_catchain_lifetime'
});
scalarFields.set('blocks.master.config.p28.shard_validators_lifetime', {
  type: 'number',
  path: 'doc.master.config.p28.shard_validators_lifetime'
});
scalarFields.set('blocks.master.config.p28.shard_validators_num', {
  type: 'number',
  path: 'doc.master.config.p28.shard_validators_num'
});
scalarFields.set('blocks.master.config.p29.new_catchain_ids', {
  type: 'boolean',
  path: 'doc.master.config.p29.new_catchain_ids'
});
scalarFields.set('blocks.master.config.p29.round_candidates', {
  type: 'number',
  path: 'doc.master.config.p29.round_candidates'
});
scalarFields.set('blocks.master.config.p29.next_candidate_delay_ms', {
  type: 'number',
  path: 'doc.master.config.p29.next_candidate_delay_ms'
});
scalarFields.set('blocks.master.config.p29.consensus_timeout_ms', {
  type: 'number',
  path: 'doc.master.config.p29.consensus_timeout_ms'
});
scalarFields.set('blocks.master.config.p29.fast_attempts', {
  type: 'number',
  path: 'doc.master.config.p29.fast_attempts'
});
scalarFields.set('blocks.master.config.p29.attempt_duration', {
  type: 'number',
  path: 'doc.master.config.p29.attempt_duration'
});
scalarFields.set('blocks.master.config.p29.catchain_max_deps', {
  type: 'number',
  path: 'doc.master.config.p29.catchain_max_deps'
});
scalarFields.set('blocks.master.config.p29.max_block_bytes', {
  type: 'number',
  path: 'doc.master.config.p29.max_block_bytes'
});
scalarFields.set('blocks.master.config.p29.max_collated_bytes', {
  type: 'number',
  path: 'doc.master.config.p29.max_collated_bytes'
});
scalarFields.set('blocks.master.config.p31', {
  type: 'string',
  path: 'doc.master.config.p31[*]'
});
scalarFields.set('blocks.master.config.p32.utime_since', {
  type: 'number',
  path: 'doc.master.config.p32.utime_since'
});
scalarFields.set('blocks.master.config.p32.utime_until', {
  type: 'number',
  path: 'doc.master.config.p32.utime_until'
});
scalarFields.set('blocks.master.config.p32.total', {
  type: 'number',
  path: 'doc.master.config.p32.total'
});
scalarFields.set('blocks.master.config.p32.total_weight', {
  type: 'uint64',
  path: 'doc.master.config.p32.total_weight'
});
scalarFields.set('blocks.master.config.p32.list.public_key', {
  type: 'string',
  path: 'doc.master.config.p32.list[*].public_key'
});
scalarFields.set('blocks.master.config.p32.list.weight', {
  type: 'uint64',
  path: 'doc.master.config.p32.list[*].weight'
});
scalarFields.set('blocks.master.config.p32.list.adnl_addr', {
  type: 'string',
  path: 'doc.master.config.p32.list[*].adnl_addr'
});
scalarFields.set('blocks.master.config.p33.utime_since', {
  type: 'number',
  path: 'doc.master.config.p33.utime_since'
});
scalarFields.set('blocks.master.config.p33.utime_until', {
  type: 'number',
  path: 'doc.master.config.p33.utime_until'
});
scalarFields.set('blocks.master.config.p33.total', {
  type: 'number',
  path: 'doc.master.config.p33.total'
});
scalarFields.set('blocks.master.config.p33.total_weight', {
  type: 'uint64',
  path: 'doc.master.config.p33.total_weight'
});
scalarFields.set('blocks.master.config.p33.list.public_key', {
  type: 'string',
  path: 'doc.master.config.p33.list[*].public_key'
});
scalarFields.set('blocks.master.config.p33.list.weight', {
  type: 'uint64',
  path: 'doc.master.config.p33.list[*].weight'
});
scalarFields.set('blocks.master.config.p33.list.adnl_addr', {
  type: 'string',
  path: 'doc.master.config.p33.list[*].adnl_addr'
});
scalarFields.set('blocks.master.config.p34.utime_since', {
  type: 'number',
  path: 'doc.master.config.p34.utime_since'
});
scalarFields.set('blocks.master.config.p34.utime_until', {
  type: 'number',
  path: 'doc.master.config.p34.utime_until'
});
scalarFields.set('blocks.master.config.p34.total', {
  type: 'number',
  path: 'doc.master.config.p34.total'
});
scalarFields.set('blocks.master.config.p34.total_weight', {
  type: 'uint64',
  path: 'doc.master.config.p34.total_weight'
});
scalarFields.set('blocks.master.config.p34.list.public_key', {
  type: 'string',
  path: 'doc.master.config.p34.list[*].public_key'
});
scalarFields.set('blocks.master.config.p34.list.weight', {
  type: 'uint64',
  path: 'doc.master.config.p34.list[*].weight'
});
scalarFields.set('blocks.master.config.p34.list.adnl_addr', {
  type: 'string',
  path: 'doc.master.config.p34.list[*].adnl_addr'
});
scalarFields.set('blocks.master.config.p35.utime_since', {
  type: 'number',
  path: 'doc.master.config.p35.utime_since'
});
scalarFields.set('blocks.master.config.p35.utime_until', {
  type: 'number',
  path: 'doc.master.config.p35.utime_until'
});
scalarFields.set('blocks.master.config.p35.total', {
  type: 'number',
  path: 'doc.master.config.p35.total'
});
scalarFields.set('blocks.master.config.p35.total_weight', {
  type: 'uint64',
  path: 'doc.master.config.p35.total_weight'
});
scalarFields.set('blocks.master.config.p35.list.public_key', {
  type: 'string',
  path: 'doc.master.config.p35.list[*].public_key'
});
scalarFields.set('blocks.master.config.p35.list.weight', {
  type: 'uint64',
  path: 'doc.master.config.p35.list[*].weight'
});
scalarFields.set('blocks.master.config.p35.list.adnl_addr', {
  type: 'string',
  path: 'doc.master.config.p35.list[*].adnl_addr'
});
scalarFields.set('blocks.master.config.p36.utime_since', {
  type: 'number',
  path: 'doc.master.config.p36.utime_since'
});
scalarFields.set('blocks.master.config.p36.utime_until', {
  type: 'number',
  path: 'doc.master.config.p36.utime_until'
});
scalarFields.set('blocks.master.config.p36.total', {
  type: 'number',
  path: 'doc.master.config.p36.total'
});
scalarFields.set('blocks.master.config.p36.total_weight', {
  type: 'uint64',
  path: 'doc.master.config.p36.total_weight'
});
scalarFields.set('blocks.master.config.p36.list.public_key', {
  type: 'string',
  path: 'doc.master.config.p36.list[*].public_key'
});
scalarFields.set('blocks.master.config.p36.list.weight', {
  type: 'uint64',
  path: 'doc.master.config.p36.list[*].weight'
});
scalarFields.set('blocks.master.config.p36.list.adnl_addr', {
  type: 'string',
  path: 'doc.master.config.p36.list[*].adnl_addr'
});
scalarFields.set('blocks.master.config.p37.utime_since', {
  type: 'number',
  path: 'doc.master.config.p37.utime_since'
});
scalarFields.set('blocks.master.config.p37.utime_until', {
  type: 'number',
  path: 'doc.master.config.p37.utime_until'
});
scalarFields.set('blocks.master.config.p37.total', {
  type: 'number',
  path: 'doc.master.config.p37.total'
});
scalarFields.set('blocks.master.config.p37.total_weight', {
  type: 'uint64',
  path: 'doc.master.config.p37.total_weight'
});
scalarFields.set('blocks.master.config.p37.list.public_key', {
  type: 'string',
  path: 'doc.master.config.p37.list[*].public_key'
});
scalarFields.set('blocks.master.config.p37.list.weight', {
  type: 'uint64',
  path: 'doc.master.config.p37.list[*].weight'
});
scalarFields.set('blocks.master.config.p37.list.adnl_addr', {
  type: 'string',
  path: 'doc.master.config.p37.list[*].adnl_addr'
});
scalarFields.set('blocks.master.config.p39.adnl_addr', {
  type: 'string',
  path: 'doc.master.config.p39[*].adnl_addr'
});
scalarFields.set('blocks.master.config.p39.temp_public_key', {
  type: 'string',
  path: 'doc.master.config.p39[*].temp_public_key'
});
scalarFields.set('blocks.master.config.p39.seqno', {
  type: 'number',
  path: 'doc.master.config.p39[*].seqno'
});
scalarFields.set('blocks.master.config.p39.valid_until', {
  type: 'number',
  path: 'doc.master.config.p39[*].valid_until'
});
scalarFields.set('blocks.master.config.p39.signature_r', {
  type: 'string',
  path: 'doc.master.config.p39[*].signature_r'
});
scalarFields.set('blocks.master.config.p39.signature_s', {
  type: 'string',
  path: 'doc.master.config.p39[*].signature_s'
});
scalarFields.set('blocks.key_block', {
  type: 'boolean',
  path: 'doc.key_block'
});
scalarFields.set('blocks.boc', {
  type: 'string',
  path: 'doc.boc'
});
scalarFields.set('transactions.id', {
  type: 'string',
  path: 'doc._key'
});
scalarFields.set('transactions.block_id', {
  type: 'string',
  path: 'doc.block_id'
});
scalarFields.set('transactions.account_addr', {
  type: 'string',
  path: 'doc.account_addr'
});
scalarFields.set('transactions.workchain_id', {
  type: 'number',
  path: 'doc.workchain_id'
});
scalarFields.set('transactions.lt', {
  type: 'uint64',
  path: 'doc.lt'
});
scalarFields.set('transactions.prev_trans_hash', {
  type: 'string',
  path: 'doc.prev_trans_hash'
});
scalarFields.set('transactions.prev_trans_lt', {
  type: 'uint64',
  path: 'doc.prev_trans_lt'
});
scalarFields.set('transactions.now', {
  type: 'number',
  path: 'doc.now'
});
scalarFields.set('transactions.outmsg_cnt', {
  type: 'number',
  path: 'doc.outmsg_cnt'
});
scalarFields.set('transactions.in_msg', {
  type: 'string',
  path: 'doc.in_msg'
});
scalarFields.set('transactions.out_msgs', {
  type: 'string',
  path: 'doc.out_msgs[*]'
});
scalarFields.set('transactions.total_fees', {
  type: 'uint1024',
  path: 'doc.total_fees'
});
scalarFields.set('transactions.total_fees_other.currency', {
  type: 'number',
  path: 'doc.total_fees_other[*].currency'
});
scalarFields.set('transactions.total_fees_other.value', {
  type: 'uint1024',
  path: 'doc.total_fees_other[*].value'
});
scalarFields.set('transactions.old_hash', {
  type: 'string',
  path: 'doc.old_hash'
});
scalarFields.set('transactions.new_hash', {
  type: 'string',
  path: 'doc.new_hash'
});
scalarFields.set('transactions.credit_first', {
  type: 'boolean',
  path: 'doc.credit_first'
});
scalarFields.set('transactions.storage.storage_fees_collected', {
  type: 'uint1024',
  path: 'doc.storage.storage_fees_collected'
});
scalarFields.set('transactions.storage.storage_fees_due', {
  type: 'uint1024',
  path: 'doc.storage.storage_fees_due'
});
scalarFields.set('transactions.credit.due_fees_collected', {
  type: 'uint1024',
  path: 'doc.credit.due_fees_collected'
});
scalarFields.set('transactions.credit.credit', {
  type: 'uint1024',
  path: 'doc.credit.credit'
});
scalarFields.set('transactions.credit.credit_other.currency', {
  type: 'number',
  path: 'doc.credit.credit_other[*].currency'
});
scalarFields.set('transactions.credit.credit_other.value', {
  type: 'uint1024',
  path: 'doc.credit.credit_other[*].value'
});
scalarFields.set('transactions.compute.success', {
  type: 'boolean',
  path: 'doc.compute.success'
});
scalarFields.set('transactions.compute.msg_state_used', {
  type: 'boolean',
  path: 'doc.compute.msg_state_used'
});
scalarFields.set('transactions.compute.account_activated', {
  type: 'boolean',
  path: 'doc.compute.account_activated'
});
scalarFields.set('transactions.compute.gas_fees', {
  type: 'uint1024',
  path: 'doc.compute.gas_fees'
});
scalarFields.set('transactions.compute.gas_used', {
  type: 'uint64',
  path: 'doc.compute.gas_used'
});
scalarFields.set('transactions.compute.gas_limit', {
  type: 'uint64',
  path: 'doc.compute.gas_limit'
});
scalarFields.set('transactions.compute.gas_credit', {
  type: 'number',
  path: 'doc.compute.gas_credit'
});
scalarFields.set('transactions.compute.mode', {
  type: 'number',
  path: 'doc.compute.mode'
});
scalarFields.set('transactions.compute.exit_code', {
  type: 'number',
  path: 'doc.compute.exit_code'
});
scalarFields.set('transactions.compute.exit_arg', {
  type: 'number',
  path: 'doc.compute.exit_arg'
});
scalarFields.set('transactions.compute.vm_steps', {
  type: 'number',
  path: 'doc.compute.vm_steps'
});
scalarFields.set('transactions.compute.vm_init_state_hash', {
  type: 'string',
  path: 'doc.compute.vm_init_state_hash'
});
scalarFields.set('transactions.compute.vm_final_state_hash', {
  type: 'string',
  path: 'doc.compute.vm_final_state_hash'
});
scalarFields.set('transactions.action.success', {
  type: 'boolean',
  path: 'doc.action.success'
});
scalarFields.set('transactions.action.valid', {
  type: 'boolean',
  path: 'doc.action.valid'
});
scalarFields.set('transactions.action.no_funds', {
  type: 'boolean',
  path: 'doc.action.no_funds'
});
scalarFields.set('transactions.action.total_fwd_fees', {
  type: 'uint1024',
  path: 'doc.action.total_fwd_fees'
});
scalarFields.set('transactions.action.total_action_fees', {
  type: 'uint1024',
  path: 'doc.action.total_action_fees'
});
scalarFields.set('transactions.action.result_code', {
  type: 'number',
  path: 'doc.action.result_code'
});
scalarFields.set('transactions.action.result_arg', {
  type: 'number',
  path: 'doc.action.result_arg'
});
scalarFields.set('transactions.action.tot_actions', {
  type: 'number',
  path: 'doc.action.tot_actions'
});
scalarFields.set('transactions.action.spec_actions', {
  type: 'number',
  path: 'doc.action.spec_actions'
});
scalarFields.set('transactions.action.skipped_actions', {
  type: 'number',
  path: 'doc.action.skipped_actions'
});
scalarFields.set('transactions.action.msgs_created', {
  type: 'number',
  path: 'doc.action.msgs_created'
});
scalarFields.set('transactions.action.action_list_hash', {
  type: 'string',
  path: 'doc.action.action_list_hash'
});
scalarFields.set('transactions.action.total_msg_size_cells', {
  type: 'number',
  path: 'doc.action.total_msg_size_cells'
});
scalarFields.set('transactions.action.total_msg_size_bits', {
  type: 'number',
  path: 'doc.action.total_msg_size_bits'
});
scalarFields.set('transactions.bounce.msg_size_cells', {
  type: 'number',
  path: 'doc.bounce.msg_size_cells'
});
scalarFields.set('transactions.bounce.msg_size_bits', {
  type: 'number',
  path: 'doc.bounce.msg_size_bits'
});
scalarFields.set('transactions.bounce.req_fwd_fees', {
  type: 'uint1024',
  path: 'doc.bounce.req_fwd_fees'
});
scalarFields.set('transactions.bounce.msg_fees', {
  type: 'uint1024',
  path: 'doc.bounce.msg_fees'
});
scalarFields.set('transactions.bounce.fwd_fees', {
  type: 'uint1024',
  path: 'doc.bounce.fwd_fees'
});
scalarFields.set('transactions.aborted', {
  type: 'boolean',
  path: 'doc.aborted'
});
scalarFields.set('transactions.destroyed', {
  type: 'boolean',
  path: 'doc.destroyed'
});
scalarFields.set('transactions.tt', {
  type: 'string',
  path: 'doc.tt'
});
scalarFields.set('transactions.split_info.cur_shard_pfx_len', {
  type: 'number',
  path: 'doc.split_info.cur_shard_pfx_len'
});
scalarFields.set('transactions.split_info.acc_split_depth', {
  type: 'number',
  path: 'doc.split_info.acc_split_depth'
});
scalarFields.set('transactions.split_info.this_addr', {
  type: 'string',
  path: 'doc.split_info.this_addr'
});
scalarFields.set('transactions.split_info.sibling_addr', {
  type: 'string',
  path: 'doc.split_info.sibling_addr'
});
scalarFields.set('transactions.prepare_transaction', {
  type: 'string',
  path: 'doc.prepare_transaction'
});
scalarFields.set('transactions.installed', {
  type: 'boolean',
  path: 'doc.installed'
});
scalarFields.set('transactions.proof', {
  type: 'string',
  path: 'doc.proof'
});
scalarFields.set('transactions.boc', {
  type: 'string',
  path: 'doc.boc'
});
scalarFields.set('messages.id', {
  type: 'string',
  path: 'doc._key'
});
scalarFields.set('messages.block_id', {
  type: 'string',
  path: 'doc.block_id'
});
scalarFields.set('messages.body', {
  type: 'string',
  path: 'doc.body'
});
scalarFields.set('messages.body_hash', {
  type: 'string',
  path: 'doc.body_hash'
});
scalarFields.set('messages.split_depth', {
  type: 'number',
  path: 'doc.split_depth'
});
scalarFields.set('messages.tick', {
  type: 'boolean',
  path: 'doc.tick'
});
scalarFields.set('messages.tock', {
  type: 'boolean',
  path: 'doc.tock'
});
scalarFields.set('messages.code', {
  type: 'string',
  path: 'doc.code'
});
scalarFields.set('messages.code_hash', {
  type: 'string',
  path: 'doc.code_hash'
});
scalarFields.set('messages.data', {
  type: 'string',
  path: 'doc.data'
});
scalarFields.set('messages.data_hash', {
  type: 'string',
  path: 'doc.data_hash'
});
scalarFields.set('messages.library', {
  type: 'string',
  path: 'doc.library'
});
scalarFields.set('messages.library_hash', {
  type: 'string',
  path: 'doc.library_hash'
});
scalarFields.set('messages.src', {
  type: 'string',
  path: 'doc.src'
});
scalarFields.set('messages.dst', {
  type: 'string',
  path: 'doc.dst'
});
scalarFields.set('messages.src_workchain_id', {
  type: 'number',
  path: 'doc.src_workchain_id'
});
scalarFields.set('messages.dst_workchain_id', {
  type: 'number',
  path: 'doc.dst_workchain_id'
});
scalarFields.set('messages.created_lt', {
  type: 'uint64',
  path: 'doc.created_lt'
});
scalarFields.set('messages.created_at', {
  type: 'number',
  path: 'doc.created_at'
});
scalarFields.set('messages.ihr_disabled', {
  type: 'boolean',
  path: 'doc.ihr_disabled'
});
scalarFields.set('messages.ihr_fee', {
  type: 'uint1024',
  path: 'doc.ihr_fee'
});
scalarFields.set('messages.fwd_fee', {
  type: 'uint1024',
  path: 'doc.fwd_fee'
});
scalarFields.set('messages.import_fee', {
  type: 'uint1024',
  path: 'doc.import_fee'
});
scalarFields.set('messages.bounce', {
  type: 'boolean',
  path: 'doc.bounce'
});
scalarFields.set('messages.bounced', {
  type: 'boolean',
  path: 'doc.bounced'
});
scalarFields.set('messages.value', {
  type: 'uint1024',
  path: 'doc.value'
});
scalarFields.set('messages.value_other.currency', {
  type: 'number',
  path: 'doc.value_other[*].currency'
});
scalarFields.set('messages.value_other.value', {
  type: 'uint1024',
  path: 'doc.value_other[*].value'
});
scalarFields.set('messages.proof', {
  type: 'string',
  path: 'doc.proof'
});
scalarFields.set('messages.boc', {
  type: 'string',
  path: 'doc.boc'
});
scalarFields.set('accounts.id', {
  type: 'string',
  path: 'doc._key'
});
scalarFields.set('accounts.workchain_id', {
  type: 'number',
  path: 'doc.workchain_id'
});
scalarFields.set('accounts.last_paid', {
  type: 'number',
  path: 'doc.last_paid'
});
scalarFields.set('accounts.due_payment', {
  type: 'uint1024',
  path: 'doc.due_payment'
});
scalarFields.set('accounts.last_trans_lt', {
  type: 'uint64',
  path: 'doc.last_trans_lt'
});
scalarFields.set('accounts.balance', {
  type: 'uint1024',
  path: 'doc.balance'
});
scalarFields.set('accounts.balance_other.currency', {
  type: 'number',
  path: 'doc.balance_other[*].currency'
});
scalarFields.set('accounts.balance_other.value', {
  type: 'uint1024',
  path: 'doc.balance_other[*].value'
});
scalarFields.set('accounts.split_depth', {
  type: 'number',
  path: 'doc.split_depth'
});
scalarFields.set('accounts.tick', {
  type: 'boolean',
  path: 'doc.tick'
});
scalarFields.set('accounts.tock', {
  type: 'boolean',
  path: 'doc.tock'
});
scalarFields.set('accounts.code', {
  type: 'string',
  path: 'doc.code'
});
scalarFields.set('accounts.code_hash', {
  type: 'string',
  path: 'doc.code_hash'
});
scalarFields.set('accounts.data', {
  type: 'string',
  path: 'doc.data'
});
scalarFields.set('accounts.data_hash', {
  type: 'string',
  path: 'doc.data_hash'
});
scalarFields.set('accounts.library', {
  type: 'string',
  path: 'doc.library'
});
scalarFields.set('accounts.library_hash', {
  type: 'string',
  path: 'doc.library_hash'
});
scalarFields.set('accounts.proof', {
  type: 'string',
  path: 'doc.proof'
});
scalarFields.set('accounts.boc', {
  type: 'string',
  path: 'doc.boc'
});
module.exports = {
  scalarFields,
  createResolvers,
  OtherCurrency,
  ExtBlkRef,
  MsgEnvelope,
  InMsg,
  OutMsg,
  BlockValueFlow,
  BlockAccountBlocksTransactions,
  BlockAccountBlocks,
  BlockStateUpdate,
  BlockMasterShardHashesDescr,
  BlockMasterShardHashes,
  BlockMasterShardFees,
  BlockMasterPrevBlkSignatures,
  BlockMasterConfigP6,
  BlockMasterConfigP7,
  BlockMasterConfigP8,
  ConfigProposalSetup,
  BlockMasterConfigP11,
  BlockMasterConfigP12,
  BlockMasterConfigP14,
  BlockMasterConfigP15,
  BlockMasterConfigP16,
  BlockMasterConfigP17,
  BlockMasterConfigP18,
  GasLimitsPrices,
  BlockLimitsBytes,
  BlockLimitsGas,
  BlockLimitsLtDelta,
  BlockLimits,
  MsgForwardPrices,
  BlockMasterConfigP28,
  BlockMasterConfigP29,
  ValidatorSetList,
  ValidatorSet,
  BlockMasterConfigP39,
  BlockMasterConfig,
  BlockMaster,
  BlockSignaturesSignatures,
  BlockSignatures,
  Block,
  TransactionStorage,
  TransactionCredit,
  TransactionCompute,
  TransactionAction,
  TransactionBounce,
  TransactionSplitInfo,
  Transaction,
  Message,
  Account
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9yZXNvbHZlcnMtZ2VuZXJhdGVkLmpzIl0sIm5hbWVzIjpbInNjYWxhciIsImJpZ1VJbnQxIiwiYmlnVUludDIiLCJyZXNvbHZlQmlnVUludCIsInN0cnVjdCIsImFycmF5Iiwiam9pbiIsImpvaW5BcnJheSIsImVudW1OYW1lIiwiY3JlYXRlRW51bU5hbWVSZXNvbHZlciIsInJlc29sdmVVbml4VGltZVN0cmluZyIsInJlcXVpcmUiLCJPdGhlckN1cnJlbmN5IiwiY3VycmVuY3kiLCJ2YWx1ZSIsIkV4dEJsa1JlZiIsImVuZF9sdCIsInNlcV9ubyIsInJvb3RfaGFzaCIsImZpbGVfaGFzaCIsIk1zZ0VudmVsb3BlIiwibXNnX2lkIiwibmV4dF9hZGRyIiwiY3VyX2FkZHIiLCJmd2RfZmVlX3JlbWFpbmluZyIsIkluTXNnIiwibXNnX3R5cGUiLCJtc2dfdHlwZV9uYW1lIiwiRXh0ZXJuYWwiLCJJaHIiLCJJbW1lZGlhdGVseSIsIkZpbmFsIiwiVHJhbnNpdCIsIkRpc2NhcmRlZEZpbmFsIiwiRGlzY2FyZGVkVHJhbnNpdCIsImlocl9mZWUiLCJwcm9vZl9jcmVhdGVkIiwiaW5fbXNnIiwiZndkX2ZlZSIsIm91dF9tc2ciLCJ0cmFuc2l0X2ZlZSIsInRyYW5zYWN0aW9uX2lkIiwicHJvb2ZfZGVsaXZlcmVkIiwiT3V0TXNnIiwiT3V0TXNnTmV3IiwiRGVxdWV1ZUltbWVkaWF0ZWx5IiwiRGVxdWV1ZSIsIlRyYW5zaXRSZXF1aXJlZCIsIkRlcXVldWVTaG9ydCIsIk5vbmUiLCJyZWltcG9ydCIsImltcG9ydGVkIiwiaW1wb3J0X2Jsb2NrX2x0IiwibXNnX2Vudl9oYXNoIiwibmV4dF93b3JrY2hhaW4iLCJuZXh0X2FkZHJfcGZ4IiwiT3RoZXJDdXJyZW5jeUFycmF5IiwiQmxvY2tWYWx1ZUZsb3ciLCJ0b19uZXh0X2JsayIsInRvX25leHRfYmxrX290aGVyIiwiZXhwb3J0ZWQiLCJleHBvcnRlZF9vdGhlciIsImZlZXNfY29sbGVjdGVkIiwiZmVlc19jb2xsZWN0ZWRfb3RoZXIiLCJjcmVhdGVkIiwiY3JlYXRlZF9vdGhlciIsImltcG9ydGVkX290aGVyIiwiZnJvbV9wcmV2X2JsayIsImZyb21fcHJldl9ibGtfb3RoZXIiLCJtaW50ZWQiLCJtaW50ZWRfb3RoZXIiLCJmZWVzX2ltcG9ydGVkIiwiZmVlc19pbXBvcnRlZF9vdGhlciIsIkJsb2NrQWNjb3VudEJsb2Nrc1RyYW5zYWN0aW9ucyIsImx0IiwidG90YWxfZmVlcyIsInRvdGFsX2ZlZXNfb3RoZXIiLCJCbG9ja0FjY291bnRCbG9ja3NUcmFuc2FjdGlvbnNBcnJheSIsIkJsb2NrQWNjb3VudEJsb2NrcyIsImFjY291bnRfYWRkciIsInRyYW5zYWN0aW9ucyIsIm9sZF9oYXNoIiwibmV3X2hhc2giLCJ0cl9jb3VudCIsIkJsb2NrU3RhdGVVcGRhdGUiLCJuZXciLCJuZXdfZGVwdGgiLCJvbGQiLCJvbGRfZGVwdGgiLCJCbG9ja01hc3RlclNoYXJkSGFzaGVzRGVzY3IiLCJyZWdfbWNfc2Vxbm8iLCJzdGFydF9sdCIsImJlZm9yZV9zcGxpdCIsImJlZm9yZV9tZXJnZSIsIndhbnRfc3BsaXQiLCJ3YW50X21lcmdlIiwibnhfY2NfdXBkYXRlZCIsImZsYWdzIiwibmV4dF9jYXRjaGFpbl9zZXFubyIsIm5leHRfdmFsaWRhdG9yX3NoYXJkIiwibWluX3JlZl9tY19zZXFubyIsImdlbl91dGltZSIsInNwbGl0X3R5cGUiLCJzcGxpdF90eXBlX25hbWUiLCJTcGxpdCIsIk1lcmdlIiwic3BsaXQiLCJmdW5kc19jcmVhdGVkIiwiZnVuZHNfY3JlYXRlZF9vdGhlciIsIkJsb2NrTWFzdGVyU2hhcmRIYXNoZXMiLCJ3b3JrY2hhaW5faWQiLCJzaGFyZCIsImRlc2NyIiwiQmxvY2tNYXN0ZXJTaGFyZEZlZXMiLCJmZWVzIiwiZmVlc19vdGhlciIsImNyZWF0ZSIsImNyZWF0ZV9vdGhlciIsIkJsb2NrTWFzdGVyUHJldkJsa1NpZ25hdHVyZXMiLCJub2RlX2lkIiwiciIsInMiLCJCbG9ja01hc3RlckNvbmZpZ1A2IiwibWludF9uZXdfcHJpY2UiLCJtaW50X2FkZF9wcmljZSIsIkJsb2NrTWFzdGVyQ29uZmlnUDciLCJCbG9ja01hc3RlckNvbmZpZ1A4IiwidmVyc2lvbiIsImNhcGFiaWxpdGllcyIsIkNvbmZpZ1Byb3Bvc2FsU2V0dXAiLCJtaW5fdG90X3JvdW5kcyIsIm1heF90b3Rfcm91bmRzIiwibWluX3dpbnMiLCJtYXhfbG9zc2VzIiwibWluX3N0b3JlX3NlYyIsIm1heF9zdG9yZV9zZWMiLCJiaXRfcHJpY2UiLCJjZWxsX3ByaWNlIiwiQmxvY2tNYXN0ZXJDb25maWdQMTEiLCJub3JtYWxfcGFyYW1zIiwiY3JpdGljYWxfcGFyYW1zIiwiQmxvY2tNYXN0ZXJDb25maWdQMTIiLCJlbmFibGVkX3NpbmNlIiwiYWN0dWFsX21pbl9zcGxpdCIsIm1pbl9zcGxpdCIsIm1heF9zcGxpdCIsImFjdGl2ZSIsImFjY2VwdF9tc2dzIiwiemVyb3N0YXRlX3Jvb3RfaGFzaCIsInplcm9zdGF0ZV9maWxlX2hhc2giLCJiYXNpYyIsInZtX3ZlcnNpb24iLCJ2bV9tb2RlIiwibWluX2FkZHJfbGVuIiwibWF4X2FkZHJfbGVuIiwiYWRkcl9sZW5fc3RlcCIsIndvcmtjaGFpbl90eXBlX2lkIiwiQmxvY2tNYXN0ZXJDb25maWdQMTQiLCJtYXN0ZXJjaGFpbl9ibG9ja19mZWUiLCJiYXNlY2hhaW5fYmxvY2tfZmVlIiwiQmxvY2tNYXN0ZXJDb25maWdQMTUiLCJ2YWxpZGF0b3JzX2VsZWN0ZWRfZm9yIiwiZWxlY3Rpb25zX3N0YXJ0X2JlZm9yZSIsImVsZWN0aW9uc19lbmRfYmVmb3JlIiwic3Rha2VfaGVsZF9mb3IiLCJCbG9ja01hc3RlckNvbmZpZ1AxNiIsIm1heF92YWxpZGF0b3JzIiwibWF4X21haW5fdmFsaWRhdG9ycyIsIm1pbl92YWxpZGF0b3JzIiwiQmxvY2tNYXN0ZXJDb25maWdQMTciLCJtaW5fc3Rha2UiLCJtYXhfc3Rha2UiLCJtaW5fdG90YWxfc3Rha2UiLCJtYXhfc3Rha2VfZmFjdG9yIiwiQmxvY2tNYXN0ZXJDb25maWdQMTgiLCJ1dGltZV9zaW5jZSIsImJpdF9wcmljZV9wcyIsImNlbGxfcHJpY2VfcHMiLCJtY19iaXRfcHJpY2VfcHMiLCJtY19jZWxsX3ByaWNlX3BzIiwiR2FzTGltaXRzUHJpY2VzIiwiZ2FzX3ByaWNlIiwiZ2FzX2xpbWl0Iiwic3BlY2lhbF9nYXNfbGltaXQiLCJnYXNfY3JlZGl0IiwiYmxvY2tfZ2FzX2xpbWl0IiwiZnJlZXplX2R1ZV9saW1pdCIsImRlbGV0ZV9kdWVfbGltaXQiLCJmbGF0X2dhc19saW1pdCIsImZsYXRfZ2FzX3ByaWNlIiwiQmxvY2tMaW1pdHNCeXRlcyIsInVuZGVybG9hZCIsInNvZnRfbGltaXQiLCJoYXJkX2xpbWl0IiwiQmxvY2tMaW1pdHNHYXMiLCJCbG9ja0xpbWl0c0x0RGVsdGEiLCJCbG9ja0xpbWl0cyIsImJ5dGVzIiwiZ2FzIiwibHRfZGVsdGEiLCJNc2dGb3J3YXJkUHJpY2VzIiwibHVtcF9wcmljZSIsImlocl9wcmljZV9mYWN0b3IiLCJmaXJzdF9mcmFjIiwibmV4dF9mcmFjIiwiQmxvY2tNYXN0ZXJDb25maWdQMjgiLCJzaHVmZmxlX21jX3ZhbGlkYXRvcnMiLCJtY19jYXRjaGFpbl9saWZldGltZSIsInNoYXJkX2NhdGNoYWluX2xpZmV0aW1lIiwic2hhcmRfdmFsaWRhdG9yc19saWZldGltZSIsInNoYXJkX3ZhbGlkYXRvcnNfbnVtIiwiQmxvY2tNYXN0ZXJDb25maWdQMjkiLCJuZXdfY2F0Y2hhaW5faWRzIiwicm91bmRfY2FuZGlkYXRlcyIsIm5leHRfY2FuZGlkYXRlX2RlbGF5X21zIiwiY29uc2Vuc3VzX3RpbWVvdXRfbXMiLCJmYXN0X2F0dGVtcHRzIiwiYXR0ZW1wdF9kdXJhdGlvbiIsImNhdGNoYWluX21heF9kZXBzIiwibWF4X2Jsb2NrX2J5dGVzIiwibWF4X2NvbGxhdGVkX2J5dGVzIiwiVmFsaWRhdG9yU2V0TGlzdCIsInB1YmxpY19rZXkiLCJ3ZWlnaHQiLCJhZG5sX2FkZHIiLCJWYWxpZGF0b3JTZXRMaXN0QXJyYXkiLCJWYWxpZGF0b3JTZXQiLCJ1dGltZV91bnRpbCIsInRvdGFsIiwidG90YWxfd2VpZ2h0IiwibGlzdCIsIkJsb2NrTWFzdGVyQ29uZmlnUDM5IiwidGVtcF9wdWJsaWNfa2V5Iiwic2Vxbm8iLCJ2YWxpZF91bnRpbCIsInNpZ25hdHVyZV9yIiwic2lnbmF0dXJlX3MiLCJCbG9ja01hc3RlckNvbmZpZ1A3QXJyYXkiLCJGbG9hdEFycmF5IiwiQmxvY2tNYXN0ZXJDb25maWdQMTJBcnJheSIsIkJsb2NrTWFzdGVyQ29uZmlnUDE4QXJyYXkiLCJTdHJpbmdBcnJheSIsIkJsb2NrTWFzdGVyQ29uZmlnUDM5QXJyYXkiLCJCbG9ja01hc3RlckNvbmZpZyIsInAwIiwicDEiLCJwMiIsInAzIiwicDQiLCJwNiIsInA3IiwicDgiLCJwOSIsInAxMCIsInAxMSIsInAxMiIsInAxNCIsInAxNSIsInAxNiIsInAxNyIsInAxOCIsInAyMCIsInAyMSIsInAyMiIsInAyMyIsInAyNCIsInAyNSIsInAyOCIsInAyOSIsInAzMSIsInAzMiIsInAzMyIsInAzNCIsInAzNSIsInAzNiIsInAzNyIsInAzOSIsIkJsb2NrTWFzdGVyU2hhcmRIYXNoZXNBcnJheSIsIkJsb2NrTWFzdGVyU2hhcmRGZWVzQXJyYXkiLCJCbG9ja01hc3RlclByZXZCbGtTaWduYXR1cmVzQXJyYXkiLCJCbG9ja01hc3RlciIsIm1pbl9zaGFyZF9nZW5fdXRpbWUiLCJtYXhfc2hhcmRfZ2VuX3V0aW1lIiwic2hhcmRfaGFzaGVzIiwic2hhcmRfZmVlcyIsInJlY292ZXJfY3JlYXRlX21zZyIsInByZXZfYmxrX3NpZ25hdHVyZXMiLCJjb25maWdfYWRkciIsImNvbmZpZyIsIkJsb2NrU2lnbmF0dXJlc1NpZ25hdHVyZXMiLCJCbG9ja1NpZ25hdHVyZXNTaWduYXR1cmVzQXJyYXkiLCJCbG9ja1NpZ25hdHVyZXMiLCJpZCIsInByb29mIiwidmFsaWRhdG9yX2xpc3RfaGFzaF9zaG9ydCIsImNhdGNoYWluX3NlcW5vIiwic2lnX3dlaWdodCIsInNpZ25hdHVyZXMiLCJibG9jayIsIkJsb2NrIiwiSW5Nc2dBcnJheSIsIk91dE1zZ0FycmF5IiwiQmxvY2tBY2NvdW50QmxvY2tzQXJyYXkiLCJzdGF0dXMiLCJzdGF0dXNfbmFtZSIsIlVua25vd24iLCJQcm9wb3NlZCIsIkZpbmFsaXplZCIsIlJlZnVzZWQiLCJnbG9iYWxfaWQiLCJhZnRlcl9tZXJnZSIsImdlbl9jYXRjaGFpbl9zZXFubyIsIm1hc3Rlcl9yZWYiLCJwcmV2X3JlZiIsInByZXZfYWx0X3JlZiIsInByZXZfdmVydF9yZWYiLCJwcmV2X3ZlcnRfYWx0X3JlZiIsImdlbl92YWxpZGF0b3JfbGlzdF9oYXNoX3Nob3J0IiwiYWZ0ZXJfc3BsaXQiLCJ2ZXJ0X3NlcV9ubyIsInByZXZfa2V5X2Jsb2NrX3NlcW5vIiwiZ2VuX3NvZnR3YXJlX3ZlcnNpb24iLCJnZW5fc29mdHdhcmVfY2FwYWJpbGl0aWVzIiwidmFsdWVfZmxvdyIsImluX21zZ19kZXNjciIsInJhbmRfc2VlZCIsIm91dF9tc2dfZGVzY3IiLCJhY2NvdW50X2Jsb2NrcyIsInN0YXRlX3VwZGF0ZSIsIm1hc3RlciIsImtleV9ibG9jayIsImJvYyIsIlRyYW5zYWN0aW9uU3RvcmFnZSIsInN0b3JhZ2VfZmVlc19jb2xsZWN0ZWQiLCJzdG9yYWdlX2ZlZXNfZHVlIiwic3RhdHVzX2NoYW5nZSIsInN0YXR1c19jaGFuZ2VfbmFtZSIsIlVuY2hhbmdlZCIsIkZyb3plbiIsIkRlbGV0ZWQiLCJUcmFuc2FjdGlvbkNyZWRpdCIsImR1ZV9mZWVzX2NvbGxlY3RlZCIsImNyZWRpdCIsImNyZWRpdF9vdGhlciIsIlRyYW5zYWN0aW9uQ29tcHV0ZSIsImNvbXB1dGVfdHlwZSIsImNvbXB1dGVfdHlwZV9uYW1lIiwiU2tpcHBlZCIsIlZtIiwic2tpcHBlZF9yZWFzb24iLCJza2lwcGVkX3JlYXNvbl9uYW1lIiwiTm9TdGF0ZSIsIkJhZFN0YXRlIiwiTm9HYXMiLCJzdWNjZXNzIiwibXNnX3N0YXRlX3VzZWQiLCJhY2NvdW50X2FjdGl2YXRlZCIsImdhc19mZWVzIiwiZ2FzX3VzZWQiLCJtb2RlIiwiZXhpdF9jb2RlIiwiZXhpdF9hcmciLCJ2bV9zdGVwcyIsInZtX2luaXRfc3RhdGVfaGFzaCIsInZtX2ZpbmFsX3N0YXRlX2hhc2giLCJUcmFuc2FjdGlvbkFjdGlvbiIsInZhbGlkIiwibm9fZnVuZHMiLCJ0b3RhbF9md2RfZmVlcyIsInRvdGFsX2FjdGlvbl9mZWVzIiwicmVzdWx0X2NvZGUiLCJyZXN1bHRfYXJnIiwidG90X2FjdGlvbnMiLCJzcGVjX2FjdGlvbnMiLCJza2lwcGVkX2FjdGlvbnMiLCJtc2dzX2NyZWF0ZWQiLCJhY3Rpb25fbGlzdF9oYXNoIiwidG90YWxfbXNnX3NpemVfY2VsbHMiLCJ0b3RhbF9tc2dfc2l6ZV9iaXRzIiwiVHJhbnNhY3Rpb25Cb3VuY2UiLCJib3VuY2VfdHlwZSIsImJvdW5jZV90eXBlX25hbWUiLCJOZWdGdW5kcyIsIk5vRnVuZHMiLCJPayIsIm1zZ19zaXplX2NlbGxzIiwibXNnX3NpemVfYml0cyIsInJlcV9md2RfZmVlcyIsIm1zZ19mZWVzIiwiZndkX2ZlZXMiLCJUcmFuc2FjdGlvblNwbGl0SW5mbyIsImN1cl9zaGFyZF9wZnhfbGVuIiwiYWNjX3NwbGl0X2RlcHRoIiwidGhpc19hZGRyIiwic2libGluZ19hZGRyIiwiTWVzc2FnZUFycmF5IiwiTWVzc2FnZSIsIlRyYW5zYWN0aW9uIiwidHJfdHlwZSIsInRyX3R5cGVfbmFtZSIsIk9yZGluYXJ5IiwiU3RvcmFnZSIsIlRpY2siLCJUb2NrIiwiU3BsaXRQcmVwYXJlIiwiU3BsaXRJbnN0YWxsIiwiTWVyZ2VQcmVwYXJlIiwiTWVyZ2VJbnN0YWxsIiwiUHJlbGltaW5hcnkiLCJibG9ja19pZCIsInByZXZfdHJhbnNfaGFzaCIsInByZXZfdHJhbnNfbHQiLCJub3ciLCJvdXRtc2dfY250Iiwib3JpZ19zdGF0dXMiLCJvcmlnX3N0YXR1c19uYW1lIiwiVW5pbml0IiwiQWN0aXZlIiwiTm9uRXhpc3QiLCJlbmRfc3RhdHVzIiwiZW5kX3N0YXR1c19uYW1lIiwiaW5fbWVzc2FnZSIsIm91dF9tc2dzIiwib3V0X21lc3NhZ2VzIiwiY3JlZGl0X2ZpcnN0Iiwic3RvcmFnZSIsImNvbXB1dGUiLCJhY3Rpb24iLCJib3VuY2UiLCJhYm9ydGVkIiwiZGVzdHJveWVkIiwidHQiLCJzcGxpdF9pbmZvIiwicHJlcGFyZV90cmFuc2FjdGlvbiIsImluc3RhbGxlZCIsIkludGVybmFsIiwiRXh0SW4iLCJFeHRPdXQiLCJRdWV1ZWQiLCJQcm9jZXNzaW5nIiwiVHJhbnNpdGluZyIsImJvZHkiLCJib2R5X2hhc2giLCJzcGxpdF9kZXB0aCIsInRpY2siLCJ0b2NrIiwiY29kZSIsImNvZGVfaGFzaCIsImRhdGEiLCJkYXRhX2hhc2giLCJsaWJyYXJ5IiwibGlicmFyeV9oYXNoIiwic3JjIiwiZHN0Iiwic3JjX3dvcmtjaGFpbl9pZCIsImRzdF93b3JrY2hhaW5faWQiLCJjcmVhdGVkX2x0IiwiY3JlYXRlZF9hdCIsImlocl9kaXNhYmxlZCIsImltcG9ydF9mZWUiLCJib3VuY2VkIiwidmFsdWVfb3RoZXIiLCJzcmNfdHJhbnNhY3Rpb24iLCJkc3RfdHJhbnNhY3Rpb24iLCJBY2NvdW50IiwiYWNjX3R5cGUiLCJhY2NfdHlwZV9uYW1lIiwibGFzdF9wYWlkIiwiZHVlX3BheW1lbnQiLCJsYXN0X3RyYW5zX2x0IiwiYmFsYW5jZSIsImJhbGFuY2Vfb3RoZXIiLCJjcmVhdGVSZXNvbHZlcnMiLCJkYiIsInBhcmVudCIsImFyZ3MiLCJnZW5fdXRpbWVfc3RyaW5nIiwidXRpbWVfc2luY2Vfc3RyaW5nIiwidXRpbWVfdW50aWxfc3RyaW5nIiwiX2tleSIsImNvbnRleHQiLCJibG9ja3MiLCJ3YWl0Rm9yRG9jIiwiYmxvY2tzX3NpZ25hdHVyZXMiLCJtZXNzYWdlcyIsIndhaXRGb3JEb2NzIiwiY3JlYXRlZF9hdF9zdHJpbmciLCJRdWVyeSIsInF1ZXJ5UmVzb2x2ZXIiLCJhY2NvdW50cyIsIlN1YnNjcmlwdGlvbiIsInN1YnNjcmlwdGlvblJlc29sdmVyIiwic2NhbGFy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QUFBQSxtQkFsQmE7QUFtQmJHLEVBQUFBLG1CQW5CYTtBQW9CYlMsRUFBQUEsb0JBcEJhO0FBcUJiRyxFQUFBQSxvQkFyQmE7QUFzQmJnQixFQUFBQSxvQkF0QmE7QUF1QmJHLEVBQUFBLG9CQXZCYTtBQXdCYkssRUFBQUEsb0JBeEJhO0FBeUJiSSxFQUFBQSxvQkF6QmE7QUEwQmJLLEVBQUFBLG9CQTFCYTtBQTJCYk0sRUFBQUEsZUEzQmE7QUE0QmJVLEVBQUFBLGdCQTVCYTtBQTZCYkksRUFBQUEsY0E3QmE7QUE4QmJDLEVBQUFBLGtCQTlCYTtBQStCYkMsRUFBQUEsV0EvQmE7QUFnQ2JJLEVBQUFBLGdCQWhDYTtBQWlDYkssRUFBQUEsb0JBakNhO0FBa0NiTSxFQUFBQSxvQkFsQ2E7QUFtQ2JVLEVBQUFBLGdCQW5DYTtBQW9DYkssRUFBQUEsWUFwQ2E7QUFxQ2JLLEVBQUFBLG9CQXJDYTtBQXNDYlksRUFBQUEsaUJBdENhO0FBdUNicUMsRUFBQUEsV0F2Q2E7QUF3Q2JTLEVBQUFBLHlCQXhDYTtBQXlDYkUsRUFBQUEsZUF6Q2E7QUEwQ2JRLEVBQUFBLEtBMUNhO0FBMkNiaUMsRUFBQUEsa0JBM0NhO0FBNENiUSxFQUFBQSxpQkE1Q2E7QUE2Q2JJLEVBQUFBLGtCQTdDYTtBQThDYnFCLEVBQUFBLGlCQTlDYTtBQStDYmMsRUFBQUEsaUJBL0NhO0FBZ0RiVyxFQUFBQSxvQkFoRGE7QUFpRGJPLEVBQUFBLFdBakRhO0FBa0RiRCxFQUFBQSxPQWxEYTtBQW1EYm9FLEVBQUFBO0FBbkRhLENBQWpCIiwic291cmNlc0NvbnRlbnQiOlsiY29uc3Qge1xuICAgIHNjYWxhcixcbiAgICBiaWdVSW50MSxcbiAgICBiaWdVSW50MixcbiAgICByZXNvbHZlQmlnVUludCxcbiAgICBzdHJ1Y3QsXG4gICAgYXJyYXksXG4gICAgam9pbixcbiAgICBqb2luQXJyYXksXG4gICAgZW51bU5hbWUsXG4gICAgY3JlYXRlRW51bU5hbWVSZXNvbHZlcixcbiAgICByZXNvbHZlVW5peFRpbWVTdHJpbmcsXG59ID0gcmVxdWlyZSgnLi9kYi10eXBlcy5qcycpO1xuY29uc3QgT3RoZXJDdXJyZW5jeSA9IHN0cnVjdCh7XG4gICAgY3VycmVuY3k6IHNjYWxhcixcbiAgICB2YWx1ZTogYmlnVUludDIsXG59KTtcblxuY29uc3QgRXh0QmxrUmVmID0gc3RydWN0KHtcbiAgICBlbmRfbHQ6IGJpZ1VJbnQxLFxuICAgIHNlcV9ubzogc2NhbGFyLFxuICAgIHJvb3RfaGFzaDogc2NhbGFyLFxuICAgIGZpbGVfaGFzaDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IE1zZ0VudmVsb3BlID0gc3RydWN0KHtcbiAgICBtc2dfaWQ6IHNjYWxhcixcbiAgICBuZXh0X2FkZHI6IHNjYWxhcixcbiAgICBjdXJfYWRkcjogc2NhbGFyLFxuICAgIGZ3ZF9mZWVfcmVtYWluaW5nOiBiaWdVSW50Mixcbn0pO1xuXG5jb25zdCBJbk1zZyA9IHN0cnVjdCh7XG4gICAgbXNnX3R5cGU6IHNjYWxhcixcbiAgICBtc2dfdHlwZV9uYW1lOiBlbnVtTmFtZSgnbXNnX3R5cGUnLCB7IEV4dGVybmFsOiAwLCBJaHI6IDEsIEltbWVkaWF0ZWx5OiAyLCBGaW5hbDogMywgVHJhbnNpdDogNCwgRGlzY2FyZGVkRmluYWw6IDUsIERpc2NhcmRlZFRyYW5zaXQ6IDYgfSksXG4gICAgbXNnX2lkOiBzY2FsYXIsXG4gICAgaWhyX2ZlZTogYmlnVUludDIsXG4gICAgcHJvb2ZfY3JlYXRlZDogc2NhbGFyLFxuICAgIGluX21zZzogTXNnRW52ZWxvcGUsXG4gICAgZndkX2ZlZTogYmlnVUludDIsXG4gICAgb3V0X21zZzogTXNnRW52ZWxvcGUsXG4gICAgdHJhbnNpdF9mZWU6IGJpZ1VJbnQyLFxuICAgIHRyYW5zYWN0aW9uX2lkOiBzY2FsYXIsXG4gICAgcHJvb2ZfZGVsaXZlcmVkOiBzY2FsYXIsXG59KTtcblxuY29uc3QgT3V0TXNnID0gc3RydWN0KHtcbiAgICBtc2dfdHlwZTogc2NhbGFyLFxuICAgIG1zZ190eXBlX25hbWU6IGVudW1OYW1lKCdtc2dfdHlwZScsIHsgRXh0ZXJuYWw6IDAsIEltbWVkaWF0ZWx5OiAxLCBPdXRNc2dOZXc6IDIsIFRyYW5zaXQ6IDMsIERlcXVldWVJbW1lZGlhdGVseTogNCwgRGVxdWV1ZTogNSwgVHJhbnNpdFJlcXVpcmVkOiA2LCBEZXF1ZXVlU2hvcnQ6IDcsIE5vbmU6IC0xIH0pLFxuICAgIG1zZ19pZDogc2NhbGFyLFxuICAgIHRyYW5zYWN0aW9uX2lkOiBzY2FsYXIsXG4gICAgb3V0X21zZzogTXNnRW52ZWxvcGUsXG4gICAgcmVpbXBvcnQ6IEluTXNnLFxuICAgIGltcG9ydGVkOiBJbk1zZyxcbiAgICBpbXBvcnRfYmxvY2tfbHQ6IGJpZ1VJbnQxLFxuICAgIG1zZ19lbnZfaGFzaDogc2NhbGFyLFxuICAgIG5leHRfd29ya2NoYWluOiBzY2FsYXIsXG4gICAgbmV4dF9hZGRyX3BmeDogYmlnVUludDEsXG59KTtcblxuY29uc3QgT3RoZXJDdXJyZW5jeUFycmF5ID0gYXJyYXkoKCkgPT4gT3RoZXJDdXJyZW5jeSk7XG5jb25zdCBCbG9ja1ZhbHVlRmxvdyA9IHN0cnVjdCh7XG4gICAgdG9fbmV4dF9ibGs6IGJpZ1VJbnQyLFxuICAgIHRvX25leHRfYmxrX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG4gICAgZXhwb3J0ZWQ6IGJpZ1VJbnQyLFxuICAgIGV4cG9ydGVkX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG4gICAgZmVlc19jb2xsZWN0ZWQ6IGJpZ1VJbnQyLFxuICAgIGZlZXNfY29sbGVjdGVkX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG4gICAgY3JlYXRlZDogYmlnVUludDIsXG4gICAgY3JlYXRlZF9vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxuICAgIGltcG9ydGVkOiBiaWdVSW50MixcbiAgICBpbXBvcnRlZF9vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxuICAgIGZyb21fcHJldl9ibGs6IGJpZ1VJbnQyLFxuICAgIGZyb21fcHJldl9ibGtfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbiAgICBtaW50ZWQ6IGJpZ1VJbnQyLFxuICAgIG1pbnRlZF9vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxuICAgIGZlZXNfaW1wb3J0ZWQ6IGJpZ1VJbnQyLFxuICAgIGZlZXNfaW1wb3J0ZWRfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbn0pO1xuXG5jb25zdCBCbG9ja0FjY291bnRCbG9ja3NUcmFuc2FjdGlvbnMgPSBzdHJ1Y3Qoe1xuICAgIGx0OiBiaWdVSW50MSxcbiAgICB0cmFuc2FjdGlvbl9pZDogc2NhbGFyLFxuICAgIHRvdGFsX2ZlZXM6IGJpZ1VJbnQyLFxuICAgIHRvdGFsX2ZlZXNfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbn0pO1xuXG5jb25zdCBCbG9ja0FjY291bnRCbG9ja3NUcmFuc2FjdGlvbnNBcnJheSA9IGFycmF5KCgpID0+IEJsb2NrQWNjb3VudEJsb2Nrc1RyYW5zYWN0aW9ucyk7XG5jb25zdCBCbG9ja0FjY291bnRCbG9ja3MgPSBzdHJ1Y3Qoe1xuICAgIGFjY291bnRfYWRkcjogc2NhbGFyLFxuICAgIHRyYW5zYWN0aW9uczogQmxvY2tBY2NvdW50QmxvY2tzVHJhbnNhY3Rpb25zQXJyYXksXG4gICAgb2xkX2hhc2g6IHNjYWxhcixcbiAgICBuZXdfaGFzaDogc2NhbGFyLFxuICAgIHRyX2NvdW50OiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tTdGF0ZVVwZGF0ZSA9IHN0cnVjdCh7XG4gICAgbmV3OiBzY2FsYXIsXG4gICAgbmV3X2hhc2g6IHNjYWxhcixcbiAgICBuZXdfZGVwdGg6IHNjYWxhcixcbiAgICBvbGQ6IHNjYWxhcixcbiAgICBvbGRfaGFzaDogc2NhbGFyLFxuICAgIG9sZF9kZXB0aDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyU2hhcmRIYXNoZXNEZXNjciA9IHN0cnVjdCh7XG4gICAgc2VxX25vOiBzY2FsYXIsXG4gICAgcmVnX21jX3NlcW5vOiBzY2FsYXIsXG4gICAgc3RhcnRfbHQ6IGJpZ1VJbnQxLFxuICAgIGVuZF9sdDogYmlnVUludDEsXG4gICAgcm9vdF9oYXNoOiBzY2FsYXIsXG4gICAgZmlsZV9oYXNoOiBzY2FsYXIsXG4gICAgYmVmb3JlX3NwbGl0OiBzY2FsYXIsXG4gICAgYmVmb3JlX21lcmdlOiBzY2FsYXIsXG4gICAgd2FudF9zcGxpdDogc2NhbGFyLFxuICAgIHdhbnRfbWVyZ2U6IHNjYWxhcixcbiAgICBueF9jY191cGRhdGVkOiBzY2FsYXIsXG4gICAgZmxhZ3M6IHNjYWxhcixcbiAgICBuZXh0X2NhdGNoYWluX3NlcW5vOiBzY2FsYXIsXG4gICAgbmV4dF92YWxpZGF0b3Jfc2hhcmQ6IHNjYWxhcixcbiAgICBtaW5fcmVmX21jX3NlcW5vOiBzY2FsYXIsXG4gICAgZ2VuX3V0aW1lOiBzY2FsYXIsXG4gICAgc3BsaXRfdHlwZTogc2NhbGFyLFxuICAgIHNwbGl0X3R5cGVfbmFtZTogZW51bU5hbWUoJ3NwbGl0X3R5cGUnLCB7IE5vbmU6IDAsIFNwbGl0OiAyLCBNZXJnZTogMyB9KSxcbiAgICBzcGxpdDogc2NhbGFyLFxuICAgIGZlZXNfY29sbGVjdGVkOiBiaWdVSW50MixcbiAgICBmZWVzX2NvbGxlY3RlZF9vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxuICAgIGZ1bmRzX2NyZWF0ZWQ6IGJpZ1VJbnQyLFxuICAgIGZ1bmRzX2NyZWF0ZWRfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlclNoYXJkSGFzaGVzID0gc3RydWN0KHtcbiAgICB3b3JrY2hhaW5faWQ6IHNjYWxhcixcbiAgICBzaGFyZDogc2NhbGFyLFxuICAgIGRlc2NyOiBCbG9ja01hc3RlclNoYXJkSGFzaGVzRGVzY3IsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJTaGFyZEZlZXMgPSBzdHJ1Y3Qoe1xuICAgIHdvcmtjaGFpbl9pZDogc2NhbGFyLFxuICAgIHNoYXJkOiBzY2FsYXIsXG4gICAgZmVlczogYmlnVUludDIsXG4gICAgZmVlc19vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxuICAgIGNyZWF0ZTogYmlnVUludDIsXG4gICAgY3JlYXRlX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJQcmV2QmxrU2lnbmF0dXJlcyA9IHN0cnVjdCh7XG4gICAgbm9kZV9pZDogc2NhbGFyLFxuICAgIHI6IHNjYWxhcixcbiAgICBzOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJDb25maWdQNiA9IHN0cnVjdCh7XG4gICAgbWludF9uZXdfcHJpY2U6IHNjYWxhcixcbiAgICBtaW50X2FkZF9wcmljZTogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnUDcgPSBzdHJ1Y3Qoe1xuICAgIGN1cnJlbmN5OiBzY2FsYXIsXG4gICAgdmFsdWU6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlckNvbmZpZ1A4ID0gc3RydWN0KHtcbiAgICB2ZXJzaW9uOiBzY2FsYXIsXG4gICAgY2FwYWJpbGl0aWVzOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQ29uZmlnUHJvcG9zYWxTZXR1cCA9IHN0cnVjdCh7XG4gICAgbWluX3RvdF9yb3VuZHM6IHNjYWxhcixcbiAgICBtYXhfdG90X3JvdW5kczogc2NhbGFyLFxuICAgIG1pbl93aW5zOiBzY2FsYXIsXG4gICAgbWF4X2xvc3Nlczogc2NhbGFyLFxuICAgIG1pbl9zdG9yZV9zZWM6IHNjYWxhcixcbiAgICBtYXhfc3RvcmVfc2VjOiBzY2FsYXIsXG4gICAgYml0X3ByaWNlOiBzY2FsYXIsXG4gICAgY2VsbF9wcmljZTogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnUDExID0gc3RydWN0KHtcbiAgICBub3JtYWxfcGFyYW1zOiBDb25maWdQcm9wb3NhbFNldHVwLFxuICAgIGNyaXRpY2FsX3BhcmFtczogQ29uZmlnUHJvcG9zYWxTZXR1cCxcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlckNvbmZpZ1AxMiA9IHN0cnVjdCh7XG4gICAgd29ya2NoYWluX2lkOiBzY2FsYXIsXG4gICAgZW5hYmxlZF9zaW5jZTogc2NhbGFyLFxuICAgIGFjdHVhbF9taW5fc3BsaXQ6IHNjYWxhcixcbiAgICBtaW5fc3BsaXQ6IHNjYWxhcixcbiAgICBtYXhfc3BsaXQ6IHNjYWxhcixcbiAgICBhY3RpdmU6IHNjYWxhcixcbiAgICBhY2NlcHRfbXNnczogc2NhbGFyLFxuICAgIGZsYWdzOiBzY2FsYXIsXG4gICAgemVyb3N0YXRlX3Jvb3RfaGFzaDogc2NhbGFyLFxuICAgIHplcm9zdGF0ZV9maWxlX2hhc2g6IHNjYWxhcixcbiAgICB2ZXJzaW9uOiBzY2FsYXIsXG4gICAgYmFzaWM6IHNjYWxhcixcbiAgICB2bV92ZXJzaW9uOiBzY2FsYXIsXG4gICAgdm1fbW9kZTogc2NhbGFyLFxuICAgIG1pbl9hZGRyX2xlbjogc2NhbGFyLFxuICAgIG1heF9hZGRyX2xlbjogc2NhbGFyLFxuICAgIGFkZHJfbGVuX3N0ZXA6IHNjYWxhcixcbiAgICB3b3JrY2hhaW5fdHlwZV9pZDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnUDE0ID0gc3RydWN0KHtcbiAgICBtYXN0ZXJjaGFpbl9ibG9ja19mZWU6IGJpZ1VJbnQyLFxuICAgIGJhc2VjaGFpbl9ibG9ja19mZWU6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnUDE1ID0gc3RydWN0KHtcbiAgICB2YWxpZGF0b3JzX2VsZWN0ZWRfZm9yOiBzY2FsYXIsXG4gICAgZWxlY3Rpb25zX3N0YXJ0X2JlZm9yZTogc2NhbGFyLFxuICAgIGVsZWN0aW9uc19lbmRfYmVmb3JlOiBzY2FsYXIsXG4gICAgc3Rha2VfaGVsZF9mb3I6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlckNvbmZpZ1AxNiA9IHN0cnVjdCh7XG4gICAgbWF4X3ZhbGlkYXRvcnM6IHNjYWxhcixcbiAgICBtYXhfbWFpbl92YWxpZGF0b3JzOiBzY2FsYXIsXG4gICAgbWluX3ZhbGlkYXRvcnM6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlckNvbmZpZ1AxNyA9IHN0cnVjdCh7XG4gICAgbWluX3N0YWtlOiBiaWdVSW50MixcbiAgICBtYXhfc3Rha2U6IGJpZ1VJbnQyLFxuICAgIG1pbl90b3RhbF9zdGFrZTogYmlnVUludDIsXG4gICAgbWF4X3N0YWtlX2ZhY3Rvcjogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnUDE4ID0gc3RydWN0KHtcbiAgICB1dGltZV9zaW5jZTogc2NhbGFyLFxuICAgIGJpdF9wcmljZV9wczogYmlnVUludDEsXG4gICAgY2VsbF9wcmljZV9wczogYmlnVUludDEsXG4gICAgbWNfYml0X3ByaWNlX3BzOiBiaWdVSW50MSxcbiAgICBtY19jZWxsX3ByaWNlX3BzOiBiaWdVSW50MSxcbn0pO1xuXG5jb25zdCBHYXNMaW1pdHNQcmljZXMgPSBzdHJ1Y3Qoe1xuICAgIGdhc19wcmljZTogYmlnVUludDEsXG4gICAgZ2FzX2xpbWl0OiBiaWdVSW50MSxcbiAgICBzcGVjaWFsX2dhc19saW1pdDogYmlnVUludDEsXG4gICAgZ2FzX2NyZWRpdDogYmlnVUludDEsXG4gICAgYmxvY2tfZ2FzX2xpbWl0OiBiaWdVSW50MSxcbiAgICBmcmVlemVfZHVlX2xpbWl0OiBiaWdVSW50MSxcbiAgICBkZWxldGVfZHVlX2xpbWl0OiBiaWdVSW50MSxcbiAgICBmbGF0X2dhc19saW1pdDogYmlnVUludDEsXG4gICAgZmxhdF9nYXNfcHJpY2U6IGJpZ1VJbnQxLFxufSk7XG5cbmNvbnN0IEJsb2NrTGltaXRzQnl0ZXMgPSBzdHJ1Y3Qoe1xuICAgIHVuZGVybG9hZDogc2NhbGFyLFxuICAgIHNvZnRfbGltaXQ6IHNjYWxhcixcbiAgICBoYXJkX2xpbWl0OiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tMaW1pdHNHYXMgPSBzdHJ1Y3Qoe1xuICAgIHVuZGVybG9hZDogc2NhbGFyLFxuICAgIHNvZnRfbGltaXQ6IHNjYWxhcixcbiAgICBoYXJkX2xpbWl0OiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tMaW1pdHNMdERlbHRhID0gc3RydWN0KHtcbiAgICB1bmRlcmxvYWQ6IHNjYWxhcixcbiAgICBzb2Z0X2xpbWl0OiBzY2FsYXIsXG4gICAgaGFyZF9saW1pdDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTGltaXRzID0gc3RydWN0KHtcbiAgICBieXRlczogQmxvY2tMaW1pdHNCeXRlcyxcbiAgICBnYXM6IEJsb2NrTGltaXRzR2FzLFxuICAgIGx0X2RlbHRhOiBCbG9ja0xpbWl0c0x0RGVsdGEsXG59KTtcblxuY29uc3QgTXNnRm9yd2FyZFByaWNlcyA9IHN0cnVjdCh7XG4gICAgbHVtcF9wcmljZTogYmlnVUludDEsXG4gICAgYml0X3ByaWNlOiBiaWdVSW50MSxcbiAgICBjZWxsX3ByaWNlOiBiaWdVSW50MSxcbiAgICBpaHJfcHJpY2VfZmFjdG9yOiBzY2FsYXIsXG4gICAgZmlyc3RfZnJhYzogc2NhbGFyLFxuICAgIG5leHRfZnJhYzogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnUDI4ID0gc3RydWN0KHtcbiAgICBzaHVmZmxlX21jX3ZhbGlkYXRvcnM6IHNjYWxhcixcbiAgICBtY19jYXRjaGFpbl9saWZldGltZTogc2NhbGFyLFxuICAgIHNoYXJkX2NhdGNoYWluX2xpZmV0aW1lOiBzY2FsYXIsXG4gICAgc2hhcmRfdmFsaWRhdG9yc19saWZldGltZTogc2NhbGFyLFxuICAgIHNoYXJkX3ZhbGlkYXRvcnNfbnVtOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJDb25maWdQMjkgPSBzdHJ1Y3Qoe1xuICAgIG5ld19jYXRjaGFpbl9pZHM6IHNjYWxhcixcbiAgICByb3VuZF9jYW5kaWRhdGVzOiBzY2FsYXIsXG4gICAgbmV4dF9jYW5kaWRhdGVfZGVsYXlfbXM6IHNjYWxhcixcbiAgICBjb25zZW5zdXNfdGltZW91dF9tczogc2NhbGFyLFxuICAgIGZhc3RfYXR0ZW1wdHM6IHNjYWxhcixcbiAgICBhdHRlbXB0X2R1cmF0aW9uOiBzY2FsYXIsXG4gICAgY2F0Y2hhaW5fbWF4X2RlcHM6IHNjYWxhcixcbiAgICBtYXhfYmxvY2tfYnl0ZXM6IHNjYWxhcixcbiAgICBtYXhfY29sbGF0ZWRfYnl0ZXM6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBWYWxpZGF0b3JTZXRMaXN0ID0gc3RydWN0KHtcbiAgICBwdWJsaWNfa2V5OiBzY2FsYXIsXG4gICAgd2VpZ2h0OiBiaWdVSW50MSxcbiAgICBhZG5sX2FkZHI6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBWYWxpZGF0b3JTZXRMaXN0QXJyYXkgPSBhcnJheSgoKSA9PiBWYWxpZGF0b3JTZXRMaXN0KTtcbmNvbnN0IFZhbGlkYXRvclNldCA9IHN0cnVjdCh7XG4gICAgdXRpbWVfc2luY2U6IHNjYWxhcixcbiAgICB1dGltZV91bnRpbDogc2NhbGFyLFxuICAgIHRvdGFsOiBzY2FsYXIsXG4gICAgdG90YWxfd2VpZ2h0OiBiaWdVSW50MSxcbiAgICBsaXN0OiBWYWxpZGF0b3JTZXRMaXN0QXJyYXksXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJDb25maWdQMzkgPSBzdHJ1Y3Qoe1xuICAgIGFkbmxfYWRkcjogc2NhbGFyLFxuICAgIHRlbXBfcHVibGljX2tleTogc2NhbGFyLFxuICAgIHNlcW5vOiBzY2FsYXIsXG4gICAgdmFsaWRfdW50aWw6IHNjYWxhcixcbiAgICBzaWduYXR1cmVfcjogc2NhbGFyLFxuICAgIHNpZ25hdHVyZV9zOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJDb25maWdQN0FycmF5ID0gYXJyYXkoKCkgPT4gQmxvY2tNYXN0ZXJDb25maWdQNyk7XG5jb25zdCBGbG9hdEFycmF5ID0gYXJyYXkoKCkgPT4gc2NhbGFyKTtcbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnUDEyQXJyYXkgPSBhcnJheSgoKSA9PiBCbG9ja01hc3RlckNvbmZpZ1AxMik7XG5jb25zdCBCbG9ja01hc3RlckNvbmZpZ1AxOEFycmF5ID0gYXJyYXkoKCkgPT4gQmxvY2tNYXN0ZXJDb25maWdQMTgpO1xuY29uc3QgU3RyaW5nQXJyYXkgPSBhcnJheSgoKSA9PiBzY2FsYXIpO1xuY29uc3QgQmxvY2tNYXN0ZXJDb25maWdQMzlBcnJheSA9IGFycmF5KCgpID0+IEJsb2NrTWFzdGVyQ29uZmlnUDM5KTtcbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnID0gc3RydWN0KHtcbiAgICBwMDogc2NhbGFyLFxuICAgIHAxOiBzY2FsYXIsXG4gICAgcDI6IHNjYWxhcixcbiAgICBwMzogc2NhbGFyLFxuICAgIHA0OiBzY2FsYXIsXG4gICAgcDY6IEJsb2NrTWFzdGVyQ29uZmlnUDYsXG4gICAgcDc6IEJsb2NrTWFzdGVyQ29uZmlnUDdBcnJheSxcbiAgICBwODogQmxvY2tNYXN0ZXJDb25maWdQOCxcbiAgICBwOTogRmxvYXRBcnJheSxcbiAgICBwMTA6IEZsb2F0QXJyYXksXG4gICAgcDExOiBCbG9ja01hc3RlckNvbmZpZ1AxMSxcbiAgICBwMTI6IEJsb2NrTWFzdGVyQ29uZmlnUDEyQXJyYXksXG4gICAgcDE0OiBCbG9ja01hc3RlckNvbmZpZ1AxNCxcbiAgICBwMTU6IEJsb2NrTWFzdGVyQ29uZmlnUDE1LFxuICAgIHAxNjogQmxvY2tNYXN0ZXJDb25maWdQMTYsXG4gICAgcDE3OiBCbG9ja01hc3RlckNvbmZpZ1AxNyxcbiAgICBwMTg6IEJsb2NrTWFzdGVyQ29uZmlnUDE4QXJyYXksXG4gICAgcDIwOiBHYXNMaW1pdHNQcmljZXMsXG4gICAgcDIxOiBHYXNMaW1pdHNQcmljZXMsXG4gICAgcDIyOiBCbG9ja0xpbWl0cyxcbiAgICBwMjM6IEJsb2NrTGltaXRzLFxuICAgIHAyNDogTXNnRm9yd2FyZFByaWNlcyxcbiAgICBwMjU6IE1zZ0ZvcndhcmRQcmljZXMsXG4gICAgcDI4OiBCbG9ja01hc3RlckNvbmZpZ1AyOCxcbiAgICBwMjk6IEJsb2NrTWFzdGVyQ29uZmlnUDI5LFxuICAgIHAzMTogU3RyaW5nQXJyYXksXG4gICAgcDMyOiBWYWxpZGF0b3JTZXQsXG4gICAgcDMzOiBWYWxpZGF0b3JTZXQsXG4gICAgcDM0OiBWYWxpZGF0b3JTZXQsXG4gICAgcDM1OiBWYWxpZGF0b3JTZXQsXG4gICAgcDM2OiBWYWxpZGF0b3JTZXQsXG4gICAgcDM3OiBWYWxpZGF0b3JTZXQsXG4gICAgcDM5OiBCbG9ja01hc3RlckNvbmZpZ1AzOUFycmF5LFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyU2hhcmRIYXNoZXNBcnJheSA9IGFycmF5KCgpID0+IEJsb2NrTWFzdGVyU2hhcmRIYXNoZXMpO1xuY29uc3QgQmxvY2tNYXN0ZXJTaGFyZEZlZXNBcnJheSA9IGFycmF5KCgpID0+IEJsb2NrTWFzdGVyU2hhcmRGZWVzKTtcbmNvbnN0IEJsb2NrTWFzdGVyUHJldkJsa1NpZ25hdHVyZXNBcnJheSA9IGFycmF5KCgpID0+IEJsb2NrTWFzdGVyUHJldkJsa1NpZ25hdHVyZXMpO1xuY29uc3QgQmxvY2tNYXN0ZXIgPSBzdHJ1Y3Qoe1xuICAgIG1pbl9zaGFyZF9nZW5fdXRpbWU6IHNjYWxhcixcbiAgICBtYXhfc2hhcmRfZ2VuX3V0aW1lOiBzY2FsYXIsXG4gICAgc2hhcmRfaGFzaGVzOiBCbG9ja01hc3RlclNoYXJkSGFzaGVzQXJyYXksXG4gICAgc2hhcmRfZmVlczogQmxvY2tNYXN0ZXJTaGFyZEZlZXNBcnJheSxcbiAgICByZWNvdmVyX2NyZWF0ZV9tc2c6IEluTXNnLFxuICAgIHByZXZfYmxrX3NpZ25hdHVyZXM6IEJsb2NrTWFzdGVyUHJldkJsa1NpZ25hdHVyZXNBcnJheSxcbiAgICBjb25maWdfYWRkcjogc2NhbGFyLFxuICAgIGNvbmZpZzogQmxvY2tNYXN0ZXJDb25maWcsXG59KTtcblxuY29uc3QgQmxvY2tTaWduYXR1cmVzU2lnbmF0dXJlcyA9IHN0cnVjdCh7XG4gICAgbm9kZV9pZDogc2NhbGFyLFxuICAgIHI6IHNjYWxhcixcbiAgICBzOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tTaWduYXR1cmVzU2lnbmF0dXJlc0FycmF5ID0gYXJyYXkoKCkgPT4gQmxvY2tTaWduYXR1cmVzU2lnbmF0dXJlcyk7XG5jb25zdCBCbG9ja1NpZ25hdHVyZXMgPSBzdHJ1Y3Qoe1xuICAgIGlkOiBzY2FsYXIsXG4gICAgZ2VuX3V0aW1lOiBzY2FsYXIsXG4gICAgc2VxX25vOiBzY2FsYXIsXG4gICAgc2hhcmQ6IHNjYWxhcixcbiAgICB3b3JrY2hhaW5faWQ6IHNjYWxhcixcbiAgICBwcm9vZjogc2NhbGFyLFxuICAgIHZhbGlkYXRvcl9saXN0X2hhc2hfc2hvcnQ6IHNjYWxhcixcbiAgICBjYXRjaGFpbl9zZXFubzogc2NhbGFyLFxuICAgIHNpZ193ZWlnaHQ6IGJpZ1VJbnQxLFxuICAgIHNpZ25hdHVyZXM6IEJsb2NrU2lnbmF0dXJlc1NpZ25hdHVyZXNBcnJheSxcbiAgICBibG9jazogam9pbignaWQnLCAnaWQnLCAnYmxvY2tzJywgKCkgPT4gQmxvY2spLFxufSwgdHJ1ZSk7XG5cbmNvbnN0IEluTXNnQXJyYXkgPSBhcnJheSgoKSA9PiBJbk1zZyk7XG5jb25zdCBPdXRNc2dBcnJheSA9IGFycmF5KCgpID0+IE91dE1zZyk7XG5jb25zdCBCbG9ja0FjY291bnRCbG9ja3NBcnJheSA9IGFycmF5KCgpID0+IEJsb2NrQWNjb3VudEJsb2Nrcyk7XG5jb25zdCBCbG9jayA9IHN0cnVjdCh7XG4gICAgaWQ6IHNjYWxhcixcbiAgICBzdGF0dXM6IHNjYWxhcixcbiAgICBzdGF0dXNfbmFtZTogZW51bU5hbWUoJ3N0YXR1cycsIHsgVW5rbm93bjogMCwgUHJvcG9zZWQ6IDEsIEZpbmFsaXplZDogMiwgUmVmdXNlZDogMyB9KSxcbiAgICBnbG9iYWxfaWQ6IHNjYWxhcixcbiAgICB3YW50X3NwbGl0OiBzY2FsYXIsXG4gICAgc2VxX25vOiBzY2FsYXIsXG4gICAgYWZ0ZXJfbWVyZ2U6IHNjYWxhcixcbiAgICBnZW5fdXRpbWU6IHNjYWxhcixcbiAgICBnZW5fY2F0Y2hhaW5fc2Vxbm86IHNjYWxhcixcbiAgICBmbGFnczogc2NhbGFyLFxuICAgIG1hc3Rlcl9yZWY6IEV4dEJsa1JlZixcbiAgICBwcmV2X3JlZjogRXh0QmxrUmVmLFxuICAgIHByZXZfYWx0X3JlZjogRXh0QmxrUmVmLFxuICAgIHByZXZfdmVydF9yZWY6IEV4dEJsa1JlZixcbiAgICBwcmV2X3ZlcnRfYWx0X3JlZjogRXh0QmxrUmVmLFxuICAgIHZlcnNpb246IHNjYWxhcixcbiAgICBnZW5fdmFsaWRhdG9yX2xpc3RfaGFzaF9zaG9ydDogc2NhbGFyLFxuICAgIGJlZm9yZV9zcGxpdDogc2NhbGFyLFxuICAgIGFmdGVyX3NwbGl0OiBzY2FsYXIsXG4gICAgd2FudF9tZXJnZTogc2NhbGFyLFxuICAgIHZlcnRfc2VxX25vOiBzY2FsYXIsXG4gICAgc3RhcnRfbHQ6IGJpZ1VJbnQxLFxuICAgIGVuZF9sdDogYmlnVUludDEsXG4gICAgd29ya2NoYWluX2lkOiBzY2FsYXIsXG4gICAgc2hhcmQ6IHNjYWxhcixcbiAgICBtaW5fcmVmX21jX3NlcW5vOiBzY2FsYXIsXG4gICAgcHJldl9rZXlfYmxvY2tfc2Vxbm86IHNjYWxhcixcbiAgICBnZW5fc29mdHdhcmVfdmVyc2lvbjogc2NhbGFyLFxuICAgIGdlbl9zb2Z0d2FyZV9jYXBhYmlsaXRpZXM6IHNjYWxhcixcbiAgICB2YWx1ZV9mbG93OiBCbG9ja1ZhbHVlRmxvdyxcbiAgICBpbl9tc2dfZGVzY3I6IEluTXNnQXJyYXksXG4gICAgcmFuZF9zZWVkOiBzY2FsYXIsXG4gICAgb3V0X21zZ19kZXNjcjogT3V0TXNnQXJyYXksXG4gICAgYWNjb3VudF9ibG9ja3M6IEJsb2NrQWNjb3VudEJsb2Nrc0FycmF5LFxuICAgIHRyX2NvdW50OiBzY2FsYXIsXG4gICAgc3RhdGVfdXBkYXRlOiBCbG9ja1N0YXRlVXBkYXRlLFxuICAgIG1hc3RlcjogQmxvY2tNYXN0ZXIsXG4gICAga2V5X2Jsb2NrOiBzY2FsYXIsXG4gICAgYm9jOiBzY2FsYXIsXG4gICAgc2lnbmF0dXJlczogam9pbignaWQnLCAnaWQnLCAnYmxvY2tzX3NpZ25hdHVyZXMnLCAoKSA9PiBCbG9ja1NpZ25hdHVyZXMpLFxufSwgdHJ1ZSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uU3RvcmFnZSA9IHN0cnVjdCh7XG4gICAgc3RvcmFnZV9mZWVzX2NvbGxlY3RlZDogYmlnVUludDIsXG4gICAgc3RvcmFnZV9mZWVzX2R1ZTogYmlnVUludDIsXG4gICAgc3RhdHVzX2NoYW5nZTogc2NhbGFyLFxuICAgIHN0YXR1c19jaGFuZ2VfbmFtZTogZW51bU5hbWUoJ3N0YXR1c19jaGFuZ2UnLCB7IFVuY2hhbmdlZDogMCwgRnJvemVuOiAxLCBEZWxldGVkOiAyIH0pLFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uQ3JlZGl0ID0gc3RydWN0KHtcbiAgICBkdWVfZmVlc19jb2xsZWN0ZWQ6IGJpZ1VJbnQyLFxuICAgIGNyZWRpdDogYmlnVUludDIsXG4gICAgY3JlZGl0X290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25Db21wdXRlID0gc3RydWN0KHtcbiAgICBjb21wdXRlX3R5cGU6IHNjYWxhcixcbiAgICBjb21wdXRlX3R5cGVfbmFtZTogZW51bU5hbWUoJ2NvbXB1dGVfdHlwZScsIHsgU2tpcHBlZDogMCwgVm06IDEgfSksXG4gICAgc2tpcHBlZF9yZWFzb246IHNjYWxhcixcbiAgICBza2lwcGVkX3JlYXNvbl9uYW1lOiBlbnVtTmFtZSgnc2tpcHBlZF9yZWFzb24nLCB7IE5vU3RhdGU6IDAsIEJhZFN0YXRlOiAxLCBOb0dhczogMiB9KSxcbiAgICBzdWNjZXNzOiBzY2FsYXIsXG4gICAgbXNnX3N0YXRlX3VzZWQ6IHNjYWxhcixcbiAgICBhY2NvdW50X2FjdGl2YXRlZDogc2NhbGFyLFxuICAgIGdhc19mZWVzOiBiaWdVSW50MixcbiAgICBnYXNfdXNlZDogYmlnVUludDEsXG4gICAgZ2FzX2xpbWl0OiBiaWdVSW50MSxcbiAgICBnYXNfY3JlZGl0OiBzY2FsYXIsXG4gICAgbW9kZTogc2NhbGFyLFxuICAgIGV4aXRfY29kZTogc2NhbGFyLFxuICAgIGV4aXRfYXJnOiBzY2FsYXIsXG4gICAgdm1fc3RlcHM6IHNjYWxhcixcbiAgICB2bV9pbml0X3N0YXRlX2hhc2g6IHNjYWxhcixcbiAgICB2bV9maW5hbF9zdGF0ZV9oYXNoOiBzY2FsYXIsXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25BY3Rpb24gPSBzdHJ1Y3Qoe1xuICAgIHN1Y2Nlc3M6IHNjYWxhcixcbiAgICB2YWxpZDogc2NhbGFyLFxuICAgIG5vX2Z1bmRzOiBzY2FsYXIsXG4gICAgc3RhdHVzX2NoYW5nZTogc2NhbGFyLFxuICAgIHN0YXR1c19jaGFuZ2VfbmFtZTogZW51bU5hbWUoJ3N0YXR1c19jaGFuZ2UnLCB7IFVuY2hhbmdlZDogMCwgRnJvemVuOiAxLCBEZWxldGVkOiAyIH0pLFxuICAgIHRvdGFsX2Z3ZF9mZWVzOiBiaWdVSW50MixcbiAgICB0b3RhbF9hY3Rpb25fZmVlczogYmlnVUludDIsXG4gICAgcmVzdWx0X2NvZGU6IHNjYWxhcixcbiAgICByZXN1bHRfYXJnOiBzY2FsYXIsXG4gICAgdG90X2FjdGlvbnM6IHNjYWxhcixcbiAgICBzcGVjX2FjdGlvbnM6IHNjYWxhcixcbiAgICBza2lwcGVkX2FjdGlvbnM6IHNjYWxhcixcbiAgICBtc2dzX2NyZWF0ZWQ6IHNjYWxhcixcbiAgICBhY3Rpb25fbGlzdF9oYXNoOiBzY2FsYXIsXG4gICAgdG90YWxfbXNnX3NpemVfY2VsbHM6IHNjYWxhcixcbiAgICB0b3RhbF9tc2dfc2l6ZV9iaXRzOiBzY2FsYXIsXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25Cb3VuY2UgPSBzdHJ1Y3Qoe1xuICAgIGJvdW5jZV90eXBlOiBzY2FsYXIsXG4gICAgYm91bmNlX3R5cGVfbmFtZTogZW51bU5hbWUoJ2JvdW5jZV90eXBlJywgeyBOZWdGdW5kczogMCwgTm9GdW5kczogMSwgT2s6IDIgfSksXG4gICAgbXNnX3NpemVfY2VsbHM6IHNjYWxhcixcbiAgICBtc2dfc2l6ZV9iaXRzOiBzY2FsYXIsXG4gICAgcmVxX2Z3ZF9mZWVzOiBiaWdVSW50MixcbiAgICBtc2dfZmVlczogYmlnVUludDIsXG4gICAgZndkX2ZlZXM6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uU3BsaXRJbmZvID0gc3RydWN0KHtcbiAgICBjdXJfc2hhcmRfcGZ4X2xlbjogc2NhbGFyLFxuICAgIGFjY19zcGxpdF9kZXB0aDogc2NhbGFyLFxuICAgIHRoaXNfYWRkcjogc2NhbGFyLFxuICAgIHNpYmxpbmdfYWRkcjogc2NhbGFyLFxufSk7XG5cbmNvbnN0IE1lc3NhZ2VBcnJheSA9IGFycmF5KCgpID0+IE1lc3NhZ2UpO1xuY29uc3QgVHJhbnNhY3Rpb24gPSBzdHJ1Y3Qoe1xuICAgIGlkOiBzY2FsYXIsXG4gICAgdHJfdHlwZTogc2NhbGFyLFxuICAgIHRyX3R5cGVfbmFtZTogZW51bU5hbWUoJ3RyX3R5cGUnLCB7IE9yZGluYXJ5OiAwLCBTdG9yYWdlOiAxLCBUaWNrOiAyLCBUb2NrOiAzLCBTcGxpdFByZXBhcmU6IDQsIFNwbGl0SW5zdGFsbDogNSwgTWVyZ2VQcmVwYXJlOiA2LCBNZXJnZUluc3RhbGw6IDcgfSksXG4gICAgc3RhdHVzOiBzY2FsYXIsXG4gICAgc3RhdHVzX25hbWU6IGVudW1OYW1lKCdzdGF0dXMnLCB7IFVua25vd246IDAsIFByZWxpbWluYXJ5OiAxLCBQcm9wb3NlZDogMiwgRmluYWxpemVkOiAzLCBSZWZ1c2VkOiA0IH0pLFxuICAgIGJsb2NrX2lkOiBzY2FsYXIsXG4gICAgYmxvY2s6IGpvaW4oJ2Jsb2NrX2lkJywgJ2lkJywgJ2Jsb2NrcycsICgpID0+IEJsb2NrKSxcbiAgICBhY2NvdW50X2FkZHI6IHNjYWxhcixcbiAgICB3b3JrY2hhaW5faWQ6IHNjYWxhcixcbiAgICBsdDogYmlnVUludDEsXG4gICAgcHJldl90cmFuc19oYXNoOiBzY2FsYXIsXG4gICAgcHJldl90cmFuc19sdDogYmlnVUludDEsXG4gICAgbm93OiBzY2FsYXIsXG4gICAgb3V0bXNnX2NudDogc2NhbGFyLFxuICAgIG9yaWdfc3RhdHVzOiBzY2FsYXIsXG4gICAgb3JpZ19zdGF0dXNfbmFtZTogZW51bU5hbWUoJ29yaWdfc3RhdHVzJywgeyBVbmluaXQ6IDAsIEFjdGl2ZTogMSwgRnJvemVuOiAyLCBOb25FeGlzdDogMyB9KSxcbiAgICBlbmRfc3RhdHVzOiBzY2FsYXIsXG4gICAgZW5kX3N0YXR1c19uYW1lOiBlbnVtTmFtZSgnZW5kX3N0YXR1cycsIHsgVW5pbml0OiAwLCBBY3RpdmU6IDEsIEZyb3plbjogMiwgTm9uRXhpc3Q6IDMgfSksXG4gICAgaW5fbXNnOiBzY2FsYXIsXG4gICAgaW5fbWVzc2FnZTogam9pbignaW5fbXNnJywgJ2lkJywgJ21lc3NhZ2VzJywgKCkgPT4gTWVzc2FnZSksXG4gICAgb3V0X21zZ3M6IFN0cmluZ0FycmF5LFxuICAgIG91dF9tZXNzYWdlczogam9pbkFycmF5KCdvdXRfbXNncycsICdpZCcsICdtZXNzYWdlcycsICgpID0+IE1lc3NhZ2UpLFxuICAgIHRvdGFsX2ZlZXM6IGJpZ1VJbnQyLFxuICAgIHRvdGFsX2ZlZXNfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbiAgICBvbGRfaGFzaDogc2NhbGFyLFxuICAgIG5ld19oYXNoOiBzY2FsYXIsXG4gICAgY3JlZGl0X2ZpcnN0OiBzY2FsYXIsXG4gICAgc3RvcmFnZTogVHJhbnNhY3Rpb25TdG9yYWdlLFxuICAgIGNyZWRpdDogVHJhbnNhY3Rpb25DcmVkaXQsXG4gICAgY29tcHV0ZTogVHJhbnNhY3Rpb25Db21wdXRlLFxuICAgIGFjdGlvbjogVHJhbnNhY3Rpb25BY3Rpb24sXG4gICAgYm91bmNlOiBUcmFuc2FjdGlvbkJvdW5jZSxcbiAgICBhYm9ydGVkOiBzY2FsYXIsXG4gICAgZGVzdHJveWVkOiBzY2FsYXIsXG4gICAgdHQ6IHNjYWxhcixcbiAgICBzcGxpdF9pbmZvOiBUcmFuc2FjdGlvblNwbGl0SW5mbyxcbiAgICBwcmVwYXJlX3RyYW5zYWN0aW9uOiBzY2FsYXIsXG4gICAgaW5zdGFsbGVkOiBzY2FsYXIsXG4gICAgcHJvb2Y6IHNjYWxhcixcbiAgICBib2M6IHNjYWxhcixcbn0sIHRydWUpO1xuXG5jb25zdCBNZXNzYWdlID0gc3RydWN0KHtcbiAgICBpZDogc2NhbGFyLFxuICAgIG1zZ190eXBlOiBzY2FsYXIsXG4gICAgbXNnX3R5cGVfbmFtZTogZW51bU5hbWUoJ21zZ190eXBlJywgeyBJbnRlcm5hbDogMCwgRXh0SW46IDEsIEV4dE91dDogMiB9KSxcbiAgICBzdGF0dXM6IHNjYWxhcixcbiAgICBzdGF0dXNfbmFtZTogZW51bU5hbWUoJ3N0YXR1cycsIHsgVW5rbm93bjogMCwgUXVldWVkOiAxLCBQcm9jZXNzaW5nOiAyLCBQcmVsaW1pbmFyeTogMywgUHJvcG9zZWQ6IDQsIEZpbmFsaXplZDogNSwgUmVmdXNlZDogNiwgVHJhbnNpdGluZzogNyB9KSxcbiAgICBibG9ja19pZDogc2NhbGFyLFxuICAgIGJsb2NrOiBqb2luKCdibG9ja19pZCcsICdpZCcsICdibG9ja3MnLCAoKSA9PiBCbG9jayksXG4gICAgYm9keTogc2NhbGFyLFxuICAgIGJvZHlfaGFzaDogc2NhbGFyLFxuICAgIHNwbGl0X2RlcHRoOiBzY2FsYXIsXG4gICAgdGljazogc2NhbGFyLFxuICAgIHRvY2s6IHNjYWxhcixcbiAgICBjb2RlOiBzY2FsYXIsXG4gICAgY29kZV9oYXNoOiBzY2FsYXIsXG4gICAgZGF0YTogc2NhbGFyLFxuICAgIGRhdGFfaGFzaDogc2NhbGFyLFxuICAgIGxpYnJhcnk6IHNjYWxhcixcbiAgICBsaWJyYXJ5X2hhc2g6IHNjYWxhcixcbiAgICBzcmM6IHNjYWxhcixcbiAgICBkc3Q6IHNjYWxhcixcbiAgICBzcmNfd29ya2NoYWluX2lkOiBzY2FsYXIsXG4gICAgZHN0X3dvcmtjaGFpbl9pZDogc2NhbGFyLFxuICAgIGNyZWF0ZWRfbHQ6IGJpZ1VJbnQxLFxuICAgIGNyZWF0ZWRfYXQ6IHNjYWxhcixcbiAgICBpaHJfZGlzYWJsZWQ6IHNjYWxhcixcbiAgICBpaHJfZmVlOiBiaWdVSW50MixcbiAgICBmd2RfZmVlOiBiaWdVSW50MixcbiAgICBpbXBvcnRfZmVlOiBiaWdVSW50MixcbiAgICBib3VuY2U6IHNjYWxhcixcbiAgICBib3VuY2VkOiBzY2FsYXIsXG4gICAgdmFsdWU6IGJpZ1VJbnQyLFxuICAgIHZhbHVlX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG4gICAgcHJvb2Y6IHNjYWxhcixcbiAgICBib2M6IHNjYWxhcixcbiAgICBzcmNfdHJhbnNhY3Rpb246IGpvaW4oJ2lkJywgJ291dF9tc2dzWypdJywgJ3RyYW5zYWN0aW9ucycsICgpID0+IFRyYW5zYWN0aW9uKSxcbiAgICBkc3RfdHJhbnNhY3Rpb246IGpvaW4oJ2lkJywgJ2luX21zZycsICd0cmFuc2FjdGlvbnMnLCAoKSA9PiBUcmFuc2FjdGlvbiksXG59LCB0cnVlKTtcblxuY29uc3QgQWNjb3VudCA9IHN0cnVjdCh7XG4gICAgaWQ6IHNjYWxhcixcbiAgICB3b3JrY2hhaW5faWQ6IHNjYWxhcixcbiAgICBhY2NfdHlwZTogc2NhbGFyLFxuICAgIGFjY190eXBlX25hbWU6IGVudW1OYW1lKCdhY2NfdHlwZScsIHsgVW5pbml0OiAwLCBBY3RpdmU6IDEsIEZyb3plbjogMiB9KSxcbiAgICBsYXN0X3BhaWQ6IHNjYWxhcixcbiAgICBkdWVfcGF5bWVudDogYmlnVUludDIsXG4gICAgbGFzdF90cmFuc19sdDogYmlnVUludDEsXG4gICAgYmFsYW5jZTogYmlnVUludDIsXG4gICAgYmFsYW5jZV9vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxuICAgIHNwbGl0X2RlcHRoOiBzY2FsYXIsXG4gICAgdGljazogc2NhbGFyLFxuICAgIHRvY2s6IHNjYWxhcixcbiAgICBjb2RlOiBzY2FsYXIsXG4gICAgY29kZV9oYXNoOiBzY2FsYXIsXG4gICAgZGF0YTogc2NhbGFyLFxuICAgIGRhdGFfaGFzaDogc2NhbGFyLFxuICAgIGxpYnJhcnk6IHNjYWxhcixcbiAgICBsaWJyYXJ5X2hhc2g6IHNjYWxhcixcbiAgICBwcm9vZjogc2NhbGFyLFxuICAgIGJvYzogc2NhbGFyLFxufSwgdHJ1ZSk7XG5cbmZ1bmN0aW9uIGNyZWF0ZVJlc29sdmVycyhkYikge1xuICAgIHJldHVybiB7XG4gICAgICAgIE90aGVyQ3VycmVuY3k6IHtcbiAgICAgICAgICAgIHZhbHVlKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudmFsdWUsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgRXh0QmxrUmVmOiB7XG4gICAgICAgICAgICBlbmRfbHQocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5lbmRfbHQsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgTXNnRW52ZWxvcGU6IHtcbiAgICAgICAgICAgIGZ3ZF9mZWVfcmVtYWluaW5nKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZndkX2ZlZV9yZW1haW5pbmcsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgSW5Nc2c6IHtcbiAgICAgICAgICAgIGlocl9mZWUocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5paHJfZmVlLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmd2RfZmVlKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZndkX2ZlZSwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdHJhbnNpdF9mZWUocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC50cmFuc2l0X2ZlZSwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbXNnX3R5cGVfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignbXNnX3R5cGUnLCB7IEV4dGVybmFsOiAwLCBJaHI6IDEsIEltbWVkaWF0ZWx5OiAyLCBGaW5hbDogMywgVHJhbnNpdDogNCwgRGlzY2FyZGVkRmluYWw6IDUsIERpc2NhcmRlZFRyYW5zaXQ6IDYgfSksXG4gICAgICAgIH0sXG4gICAgICAgIE91dE1zZzoge1xuICAgICAgICAgICAgaW1wb3J0X2Jsb2NrX2x0KHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuaW1wb3J0X2Jsb2NrX2x0LCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBuZXh0X2FkZHJfcGZ4KHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQubmV4dF9hZGRyX3BmeCwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbXNnX3R5cGVfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignbXNnX3R5cGUnLCB7IEV4dGVybmFsOiAwLCBJbW1lZGlhdGVseTogMSwgT3V0TXNnTmV3OiAyLCBUcmFuc2l0OiAzLCBEZXF1ZXVlSW1tZWRpYXRlbHk6IDQsIERlcXVldWU6IDUsIFRyYW5zaXRSZXF1aXJlZDogNiwgRGVxdWV1ZVNob3J0OiA3LCBOb25lOiAtMSB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tWYWx1ZUZsb3c6IHtcbiAgICAgICAgICAgIHRvX25leHRfYmxrKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudG9fbmV4dF9ibGssIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGV4cG9ydGVkKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZXhwb3J0ZWQsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZlZXNfY29sbGVjdGVkKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZmVlc19jb2xsZWN0ZWQsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNyZWF0ZWQocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5jcmVhdGVkLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBpbXBvcnRlZChwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmltcG9ydGVkLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmcm9tX3ByZXZfYmxrKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZnJvbV9wcmV2X2JsaywgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbWludGVkKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQubWludGVkLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmZWVzX2ltcG9ydGVkKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZmVlc19pbXBvcnRlZCwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBCbG9ja0FjY291bnRCbG9ja3NUcmFuc2FjdGlvbnM6IHtcbiAgICAgICAgICAgIGx0KHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQubHQsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRvdGFsX2ZlZXMocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC50b3RhbF9mZWVzLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrTWFzdGVyU2hhcmRIYXNoZXNEZXNjcjoge1xuICAgICAgICAgICAgc3RhcnRfbHQocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5zdGFydF9sdCwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZW5kX2x0KHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuZW5kX2x0LCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmZWVzX2NvbGxlY3RlZChwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZlZXNfY29sbGVjdGVkLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmdW5kc19jcmVhdGVkKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZnVuZHNfY3JlYXRlZCwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2VuX3V0aW1lX3N0cmluZyhwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZVVuaXhUaW1lU3RyaW5nKHBhcmVudC5nZW5fdXRpbWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHNwbGl0X3R5cGVfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignc3BsaXRfdHlwZScsIHsgTm9uZTogMCwgU3BsaXQ6IDIsIE1lcmdlOiAzIH0pLFxuICAgICAgICB9LFxuICAgICAgICBCbG9ja01hc3RlclNoYXJkRmVlczoge1xuICAgICAgICAgICAgZmVlcyhwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZlZXMsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNyZWF0ZShwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmNyZWF0ZSwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBCbG9ja01hc3RlckNvbmZpZ1AxNDoge1xuICAgICAgICAgICAgbWFzdGVyY2hhaW5fYmxvY2tfZmVlKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQubWFzdGVyY2hhaW5fYmxvY2tfZmVlLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBiYXNlY2hhaW5fYmxvY2tfZmVlKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuYmFzZWNoYWluX2Jsb2NrX2ZlZSwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBCbG9ja01hc3RlckNvbmZpZ1AxNzoge1xuICAgICAgICAgICAgbWluX3N0YWtlKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQubWluX3N0YWtlLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBtYXhfc3Rha2UocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5tYXhfc3Rha2UsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG1pbl90b3RhbF9zdGFrZShwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50Lm1pbl90b3RhbF9zdGFrZSwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBCbG9ja01hc3RlckNvbmZpZ1AxODoge1xuICAgICAgICAgICAgYml0X3ByaWNlX3BzKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuYml0X3ByaWNlX3BzLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjZWxsX3ByaWNlX3BzKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuY2VsbF9wcmljZV9wcywgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbWNfYml0X3ByaWNlX3BzKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQubWNfYml0X3ByaWNlX3BzLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBtY19jZWxsX3ByaWNlX3BzKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQubWNfY2VsbF9wcmljZV9wcywgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdXRpbWVfc2luY2Vfc3RyaW5nKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlVW5peFRpbWVTdHJpbmcocGFyZW50LnV0aW1lX3NpbmNlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEdhc0xpbWl0c1ByaWNlczoge1xuICAgICAgICAgICAgZ2FzX3ByaWNlKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuZ2FzX3ByaWNlLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnYXNfbGltaXQocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5nYXNfbGltaXQsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHNwZWNpYWxfZ2FzX2xpbWl0KHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuc3BlY2lhbF9nYXNfbGltaXQsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdhc19jcmVkaXQocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5nYXNfY3JlZGl0LCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBibG9ja19nYXNfbGltaXQocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5ibG9ja19nYXNfbGltaXQsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZyZWV6ZV9kdWVfbGltaXQocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5mcmVlemVfZHVlX2xpbWl0LCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBkZWxldGVfZHVlX2xpbWl0KHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuZGVsZXRlX2R1ZV9saW1pdCwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZmxhdF9nYXNfbGltaXQocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5mbGF0X2dhc19saW1pdCwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZmxhdF9nYXNfcHJpY2UocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5mbGF0X2dhc19wcmljZSwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBNc2dGb3J3YXJkUHJpY2VzOiB7XG4gICAgICAgICAgICBsdW1wX3ByaWNlKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQubHVtcF9wcmljZSwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgYml0X3ByaWNlKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuYml0X3ByaWNlLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjZWxsX3ByaWNlKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuY2VsbF9wcmljZSwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBWYWxpZGF0b3JTZXRMaXN0OiB7XG4gICAgICAgICAgICB3ZWlnaHQocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC53ZWlnaHQsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgVmFsaWRhdG9yU2V0OiB7XG4gICAgICAgICAgICB0b3RhbF93ZWlnaHQocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC50b3RhbF93ZWlnaHQsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHV0aW1lX3NpbmNlX3N0cmluZyhwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZVVuaXhUaW1lU3RyaW5nKHBhcmVudC51dGltZV9zaW5jZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdXRpbWVfdW50aWxfc3RyaW5nKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlVW5peFRpbWVTdHJpbmcocGFyZW50LnV0aW1lX3VudGlsKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrU2lnbmF0dXJlczoge1xuICAgICAgICAgICAgaWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcmVudC5fa2V5O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGJsb2NrKHBhcmVudCwgYXJncywgY29udGV4dCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBjb250ZXh0LmRiLmJsb2Nrcy53YWl0Rm9yRG9jKHBhcmVudC5fa2V5LCAnX2tleScsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHNpZ193ZWlnaHQocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5zaWdfd2VpZ2h0LCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnZW5fdXRpbWVfc3RyaW5nKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlVW5peFRpbWVTdHJpbmcocGFyZW50Lmdlbl91dGltZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBCbG9jazoge1xuICAgICAgICAgICAgaWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcmVudC5fa2V5O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHNpZ25hdHVyZXMocGFyZW50LCBhcmdzLCBjb250ZXh0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnRleHQuZGIuYmxvY2tzX3NpZ25hdHVyZXMud2FpdEZvckRvYyhwYXJlbnQuX2tleSwgJ19rZXknLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzdGFydF9sdChwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LnN0YXJ0X2x0LCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBlbmRfbHQocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5lbmRfbHQsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdlbl91dGltZV9zdHJpbmcocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVVbml4VGltZVN0cmluZyhwYXJlbnQuZ2VuX3V0aW1lKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzdGF0dXNfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignc3RhdHVzJywgeyBVbmtub3duOiAwLCBQcm9wb3NlZDogMSwgRmluYWxpemVkOiAyLCBSZWZ1c2VkOiAzIH0pLFxuICAgICAgICB9LFxuICAgICAgICBUcmFuc2FjdGlvblN0b3JhZ2U6IHtcbiAgICAgICAgICAgIHN0b3JhZ2VfZmVlc19jb2xsZWN0ZWQocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5zdG9yYWdlX2ZlZXNfY29sbGVjdGVkLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzdG9yYWdlX2ZlZXNfZHVlKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuc3RvcmFnZV9mZWVzX2R1ZSwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc3RhdHVzX2NoYW5nZV9uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdzdGF0dXNfY2hhbmdlJywgeyBVbmNoYW5nZWQ6IDAsIEZyb3plbjogMSwgRGVsZXRlZDogMiB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgVHJhbnNhY3Rpb25DcmVkaXQ6IHtcbiAgICAgICAgICAgIGR1ZV9mZWVzX2NvbGxlY3RlZChwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmR1ZV9mZWVzX2NvbGxlY3RlZCwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY3JlZGl0KHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuY3JlZGl0LCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIFRyYW5zYWN0aW9uQ29tcHV0ZToge1xuICAgICAgICAgICAgZ2FzX2ZlZXMocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5nYXNfZmVlcywgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2FzX3VzZWQocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5nYXNfdXNlZCwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2FzX2xpbWl0KHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuZ2FzX2xpbWl0LCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjb21wdXRlX3R5cGVfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignY29tcHV0ZV90eXBlJywgeyBTa2lwcGVkOiAwLCBWbTogMSB9KSxcbiAgICAgICAgICAgIHNraXBwZWRfcmVhc29uX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ3NraXBwZWRfcmVhc29uJywgeyBOb1N0YXRlOiAwLCBCYWRTdGF0ZTogMSwgTm9HYXM6IDIgfSksXG4gICAgICAgIH0sXG4gICAgICAgIFRyYW5zYWN0aW9uQWN0aW9uOiB7XG4gICAgICAgICAgICB0b3RhbF9md2RfZmVlcyhwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnRvdGFsX2Z3ZF9mZWVzLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0b3RhbF9hY3Rpb25fZmVlcyhwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnRvdGFsX2FjdGlvbl9mZWVzLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzdGF0dXNfY2hhbmdlX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ3N0YXR1c19jaGFuZ2UnLCB7IFVuY2hhbmdlZDogMCwgRnJvemVuOiAxLCBEZWxldGVkOiAyIH0pLFxuICAgICAgICB9LFxuICAgICAgICBUcmFuc2FjdGlvbkJvdW5jZToge1xuICAgICAgICAgICAgcmVxX2Z3ZF9mZWVzKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQucmVxX2Z3ZF9mZWVzLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBtc2dfZmVlcyhwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50Lm1zZ19mZWVzLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmd2RfZmVlcyhwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZ3ZF9mZWVzLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBib3VuY2VfdHlwZV9uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdib3VuY2VfdHlwZScsIHsgTmVnRnVuZHM6IDAsIE5vRnVuZHM6IDEsIE9rOiAyIH0pLFxuICAgICAgICB9LFxuICAgICAgICBUcmFuc2FjdGlvbjoge1xuICAgICAgICAgICAgaWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcmVudC5fa2V5O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGJsb2NrKHBhcmVudCwgYXJncywgY29udGV4dCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBjb250ZXh0LmRiLmJsb2Nrcy53YWl0Rm9yRG9jKHBhcmVudC5ibG9ja19pZCwgJ19rZXknLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBpbl9tZXNzYWdlKHBhcmVudCwgYXJncywgY29udGV4dCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBjb250ZXh0LmRiLm1lc3NhZ2VzLndhaXRGb3JEb2MocGFyZW50LmluX21zZywgJ19rZXknLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBvdXRfbWVzc2FnZXMocGFyZW50LCBhcmdzLCBjb250ZXh0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnRleHQuZGIubWVzc2FnZXMud2FpdEZvckRvY3MocGFyZW50Lm91dF9tc2dzLCAnX2tleScsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGx0KHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQubHQsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHByZXZfdHJhbnNfbHQocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5wcmV2X3RyYW5zX2x0LCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0b3RhbF9mZWVzKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudG90YWxfZmVlcywgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdHJfdHlwZV9uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCd0cl90eXBlJywgeyBPcmRpbmFyeTogMCwgU3RvcmFnZTogMSwgVGljazogMiwgVG9jazogMywgU3BsaXRQcmVwYXJlOiA0LCBTcGxpdEluc3RhbGw6IDUsIE1lcmdlUHJlcGFyZTogNiwgTWVyZ2VJbnN0YWxsOiA3IH0pLFxuICAgICAgICAgICAgc3RhdHVzX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ3N0YXR1cycsIHsgVW5rbm93bjogMCwgUHJlbGltaW5hcnk6IDEsIFByb3Bvc2VkOiAyLCBGaW5hbGl6ZWQ6IDMsIFJlZnVzZWQ6IDQgfSksXG4gICAgICAgICAgICBvcmlnX3N0YXR1c19uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdvcmlnX3N0YXR1cycsIHsgVW5pbml0OiAwLCBBY3RpdmU6IDEsIEZyb3plbjogMiwgTm9uRXhpc3Q6IDMgfSksXG4gICAgICAgICAgICBlbmRfc3RhdHVzX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ2VuZF9zdGF0dXMnLCB7IFVuaW5pdDogMCwgQWN0aXZlOiAxLCBGcm96ZW46IDIsIE5vbkV4aXN0OiAzIH0pLFxuICAgICAgICB9LFxuICAgICAgICBNZXNzYWdlOiB7XG4gICAgICAgICAgICBpZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyZW50Ll9rZXk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgYmxvY2socGFyZW50LCBhcmdzLCBjb250ZXh0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnRleHQuZGIuYmxvY2tzLndhaXRGb3JEb2MocGFyZW50LmJsb2NrX2lkLCAnX2tleScsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHNyY190cmFuc2FjdGlvbihwYXJlbnQsIGFyZ3MsIGNvbnRleHQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyZW50LmNyZWF0ZWRfbHQgIT09ICcwMCcgJiYgcGFyZW50Lm1zZ190eXBlICE9PSAxID8gY29udGV4dC5kYi50cmFuc2FjdGlvbnMud2FpdEZvckRvYyhwYXJlbnQuX2tleSwgJ291dF9tc2dzWypdJywgYXJncykgOiBudWxsO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGRzdF90cmFuc2FjdGlvbihwYXJlbnQsIGFyZ3MsIGNvbnRleHQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyZW50Lm1zZ190eXBlICE9PSAyID8gY29udGV4dC5kYi50cmFuc2FjdGlvbnMud2FpdEZvckRvYyhwYXJlbnQuX2tleSwgJ2luX21zZycsIGFyZ3MpIDogbnVsbDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjcmVhdGVkX2x0KHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuY3JlYXRlZF9sdCwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaWhyX2ZlZShwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50Lmlocl9mZWUsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZ3ZF9mZWUocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5md2RfZmVlLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBpbXBvcnRfZmVlKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuaW1wb3J0X2ZlZSwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdmFsdWUocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC52YWx1ZSwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY3JlYXRlZF9hdF9zdHJpbmcocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVVbml4VGltZVN0cmluZyhwYXJlbnQuY3JlYXRlZF9hdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbXNnX3R5cGVfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignbXNnX3R5cGUnLCB7IEludGVybmFsOiAwLCBFeHRJbjogMSwgRXh0T3V0OiAyIH0pLFxuICAgICAgICAgICAgc3RhdHVzX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ3N0YXR1cycsIHsgVW5rbm93bjogMCwgUXVldWVkOiAxLCBQcm9jZXNzaW5nOiAyLCBQcmVsaW1pbmFyeTogMywgUHJvcG9zZWQ6IDQsIEZpbmFsaXplZDogNSwgUmVmdXNlZDogNiwgVHJhbnNpdGluZzogNyB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgQWNjb3VudDoge1xuICAgICAgICAgICAgaWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcmVudC5fa2V5O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGR1ZV9wYXltZW50KHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZHVlX3BheW1lbnQsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGxhc3RfdHJhbnNfbHQocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5sYXN0X3RyYW5zX2x0LCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBiYWxhbmNlKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuYmFsYW5jZSwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgYWNjX3R5cGVfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignYWNjX3R5cGUnLCB7IFVuaW5pdDogMCwgQWN0aXZlOiAxLCBGcm96ZW46IDIgfSksXG4gICAgICAgIH0sXG4gICAgICAgIFF1ZXJ5OiB7XG4gICAgICAgICAgICBibG9ja3Nfc2lnbmF0dXJlczogZGIuYmxvY2tzX3NpZ25hdHVyZXMucXVlcnlSZXNvbHZlcigpLFxuICAgICAgICAgICAgYmxvY2tzOiBkYi5ibG9ja3MucXVlcnlSZXNvbHZlcigpLFxuICAgICAgICAgICAgdHJhbnNhY3Rpb25zOiBkYi50cmFuc2FjdGlvbnMucXVlcnlSZXNvbHZlcigpLFxuICAgICAgICAgICAgbWVzc2FnZXM6IGRiLm1lc3NhZ2VzLnF1ZXJ5UmVzb2x2ZXIoKSxcbiAgICAgICAgICAgIGFjY291bnRzOiBkYi5hY2NvdW50cy5xdWVyeVJlc29sdmVyKCksXG4gICAgICAgIH0sXG4gICAgICAgIFN1YnNjcmlwdGlvbjoge1xuICAgICAgICAgICAgYmxvY2tzX3NpZ25hdHVyZXM6IGRiLmJsb2Nrc19zaWduYXR1cmVzLnN1YnNjcmlwdGlvblJlc29sdmVyKCksXG4gICAgICAgICAgICBibG9ja3M6IGRiLmJsb2Nrcy5zdWJzY3JpcHRpb25SZXNvbHZlcigpLFxuICAgICAgICAgICAgdHJhbnNhY3Rpb25zOiBkYi50cmFuc2FjdGlvbnMuc3Vic2NyaXB0aW9uUmVzb2x2ZXIoKSxcbiAgICAgICAgICAgIG1lc3NhZ2VzOiBkYi5tZXNzYWdlcy5zdWJzY3JpcHRpb25SZXNvbHZlcigpLFxuICAgICAgICAgICAgYWNjb3VudHM6IGRiLmFjY291bnRzLnN1YnNjcmlwdGlvblJlc29sdmVyKCksXG4gICAgICAgIH1cbiAgICB9XG59XG5cbmNvbnN0IHNjYWxhckZpZWxkcyA9IG5ldyBNYXAoKTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrc19zaWduYXR1cmVzLmlkJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5fa2V5JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrc19zaWduYXR1cmVzLmdlbl91dGltZScsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MuZ2VuX3V0aW1lJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrc19zaWduYXR1cmVzLnNlcV9ubycsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2Muc2VxX25vJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrc19zaWduYXR1cmVzLnNoYXJkJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5zaGFyZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3Nfc2lnbmF0dXJlcy53b3JrY2hhaW5faWQnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLndvcmtjaGFpbl9pZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3Nfc2lnbmF0dXJlcy5wcm9vZicsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MucHJvb2YnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzX3NpZ25hdHVyZXMudmFsaWRhdG9yX2xpc3RfaGFzaF9zaG9ydCcsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MudmFsaWRhdG9yX2xpc3RfaGFzaF9zaG9ydCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3Nfc2lnbmF0dXJlcy5jYXRjaGFpbl9zZXFubycsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MuY2F0Y2hhaW5fc2Vxbm8nIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzX3NpZ25hdHVyZXMuc2lnX3dlaWdodCcsIHsgdHlwZTogJ3VpbnQ2NCcsIHBhdGg6ICdkb2Muc2lnX3dlaWdodCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3Nfc2lnbmF0dXJlcy5zaWduYXR1cmVzLm5vZGVfaWQnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLnNpZ25hdHVyZXNbKl0ubm9kZV9pZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3Nfc2lnbmF0dXJlcy5zaWduYXR1cmVzLnInLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLnNpZ25hdHVyZXNbKl0ucicgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3Nfc2lnbmF0dXJlcy5zaWduYXR1cmVzLnMnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLnNpZ25hdHVyZXNbKl0ucycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MuaWQnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLl9rZXknIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLmdsb2JhbF9pZCcsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MuZ2xvYmFsX2lkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy53YW50X3NwbGl0JywgeyB0eXBlOiAnYm9vbGVhbicsIHBhdGg6ICdkb2Mud2FudF9zcGxpdCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3Muc2VxX25vJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5zZXFfbm8nIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLmFmdGVyX21lcmdlJywgeyB0eXBlOiAnYm9vbGVhbicsIHBhdGg6ICdkb2MuYWZ0ZXJfbWVyZ2UnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLmdlbl91dGltZScsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MuZ2VuX3V0aW1lJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5nZW5fY2F0Y2hhaW5fc2Vxbm8nLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLmdlbl9jYXRjaGFpbl9zZXFubycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MuZmxhZ3MnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLmZsYWdzJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXJfcmVmLmVuZF9sdCcsIHsgdHlwZTogJ3VpbnQ2NCcsIHBhdGg6ICdkb2MubWFzdGVyX3JlZi5lbmRfbHQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlcl9yZWYuc2VxX25vJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXJfcmVmLnNlcV9ubycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyX3JlZi5yb290X2hhc2gnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm1hc3Rlcl9yZWYucm9vdF9oYXNoJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXJfcmVmLmZpbGVfaGFzaCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MubWFzdGVyX3JlZi5maWxlX2hhc2gnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLnByZXZfcmVmLmVuZF9sdCcsIHsgdHlwZTogJ3VpbnQ2NCcsIHBhdGg6ICdkb2MucHJldl9yZWYuZW5kX2x0JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5wcmV2X3JlZi5zZXFfbm8nLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLnByZXZfcmVmLnNlcV9ubycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MucHJldl9yZWYucm9vdF9oYXNoJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5wcmV2X3JlZi5yb290X2hhc2gnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLnByZXZfcmVmLmZpbGVfaGFzaCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MucHJldl9yZWYuZmlsZV9oYXNoJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5wcmV2X2FsdF9yZWYuZW5kX2x0JywgeyB0eXBlOiAndWludDY0JywgcGF0aDogJ2RvYy5wcmV2X2FsdF9yZWYuZW5kX2x0JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5wcmV2X2FsdF9yZWYuc2VxX25vJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5wcmV2X2FsdF9yZWYuc2VxX25vJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5wcmV2X2FsdF9yZWYucm9vdF9oYXNoJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5wcmV2X2FsdF9yZWYucm9vdF9oYXNoJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5wcmV2X2FsdF9yZWYuZmlsZV9oYXNoJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5wcmV2X2FsdF9yZWYuZmlsZV9oYXNoJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5wcmV2X3ZlcnRfcmVmLmVuZF9sdCcsIHsgdHlwZTogJ3VpbnQ2NCcsIHBhdGg6ICdkb2MucHJldl92ZXJ0X3JlZi5lbmRfbHQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLnByZXZfdmVydF9yZWYuc2VxX25vJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5wcmV2X3ZlcnRfcmVmLnNlcV9ubycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MucHJldl92ZXJ0X3JlZi5yb290X2hhc2gnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLnByZXZfdmVydF9yZWYucm9vdF9oYXNoJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5wcmV2X3ZlcnRfcmVmLmZpbGVfaGFzaCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MucHJldl92ZXJ0X3JlZi5maWxlX2hhc2gnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLnByZXZfdmVydF9hbHRfcmVmLmVuZF9sdCcsIHsgdHlwZTogJ3VpbnQ2NCcsIHBhdGg6ICdkb2MucHJldl92ZXJ0X2FsdF9yZWYuZW5kX2x0JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5wcmV2X3ZlcnRfYWx0X3JlZi5zZXFfbm8nLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLnByZXZfdmVydF9hbHRfcmVmLnNlcV9ubycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MucHJldl92ZXJ0X2FsdF9yZWYucm9vdF9oYXNoJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5wcmV2X3ZlcnRfYWx0X3JlZi5yb290X2hhc2gnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLnByZXZfdmVydF9hbHRfcmVmLmZpbGVfaGFzaCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MucHJldl92ZXJ0X2FsdF9yZWYuZmlsZV9oYXNoJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy52ZXJzaW9uJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy52ZXJzaW9uJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5nZW5fdmFsaWRhdG9yX2xpc3RfaGFzaF9zaG9ydCcsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MuZ2VuX3ZhbGlkYXRvcl9saXN0X2hhc2hfc2hvcnQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLmJlZm9yZV9zcGxpdCcsIHsgdHlwZTogJ2Jvb2xlYW4nLCBwYXRoOiAnZG9jLmJlZm9yZV9zcGxpdCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MuYWZ0ZXJfc3BsaXQnLCB7IHR5cGU6ICdib29sZWFuJywgcGF0aDogJ2RvYy5hZnRlcl9zcGxpdCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3Mud2FudF9tZXJnZScsIHsgdHlwZTogJ2Jvb2xlYW4nLCBwYXRoOiAnZG9jLndhbnRfbWVyZ2UnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLnZlcnRfc2VxX25vJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy52ZXJ0X3NlcV9ubycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3Muc3RhcnRfbHQnLCB7IHR5cGU6ICd1aW50NjQnLCBwYXRoOiAnZG9jLnN0YXJ0X2x0JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5lbmRfbHQnLCB7IHR5cGU6ICd1aW50NjQnLCBwYXRoOiAnZG9jLmVuZF9sdCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3Mud29ya2NoYWluX2lkJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy53b3JrY2hhaW5faWQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLnNoYXJkJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5zaGFyZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWluX3JlZl9tY19zZXFubycsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWluX3JlZl9tY19zZXFubycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MucHJldl9rZXlfYmxvY2tfc2Vxbm8nLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLnByZXZfa2V5X2Jsb2NrX3NlcW5vJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5nZW5fc29mdHdhcmVfdmVyc2lvbicsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MuZ2VuX3NvZnR3YXJlX3ZlcnNpb24nIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLmdlbl9zb2Z0d2FyZV9jYXBhYmlsaXRpZXMnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLmdlbl9zb2Z0d2FyZV9jYXBhYmlsaXRpZXMnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLnZhbHVlX2Zsb3cudG9fbmV4dF9ibGsnLCB7IHR5cGU6ICd1aW50MTAyNCcsIHBhdGg6ICdkb2MudmFsdWVfZmxvdy50b19uZXh0X2JsaycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MudmFsdWVfZmxvdy50b19uZXh0X2Jsa19vdGhlci5jdXJyZW5jeScsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MudmFsdWVfZmxvdy50b19uZXh0X2Jsa19vdGhlclsqXS5jdXJyZW5jeScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MudmFsdWVfZmxvdy50b19uZXh0X2Jsa19vdGhlci52YWx1ZScsIHsgdHlwZTogJ3VpbnQxMDI0JywgcGF0aDogJ2RvYy52YWx1ZV9mbG93LnRvX25leHRfYmxrX290aGVyWypdLnZhbHVlJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy52YWx1ZV9mbG93LmV4cG9ydGVkJywgeyB0eXBlOiAndWludDEwMjQnLCBwYXRoOiAnZG9jLnZhbHVlX2Zsb3cuZXhwb3J0ZWQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLnZhbHVlX2Zsb3cuZXhwb3J0ZWRfb3RoZXIuY3VycmVuY3knLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLnZhbHVlX2Zsb3cuZXhwb3J0ZWRfb3RoZXJbKl0uY3VycmVuY3knIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLnZhbHVlX2Zsb3cuZXhwb3J0ZWRfb3RoZXIudmFsdWUnLCB7IHR5cGU6ICd1aW50MTAyNCcsIHBhdGg6ICdkb2MudmFsdWVfZmxvdy5leHBvcnRlZF9vdGhlclsqXS52YWx1ZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MudmFsdWVfZmxvdy5mZWVzX2NvbGxlY3RlZCcsIHsgdHlwZTogJ3VpbnQxMDI0JywgcGF0aDogJ2RvYy52YWx1ZV9mbG93LmZlZXNfY29sbGVjdGVkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy52YWx1ZV9mbG93LmZlZXNfY29sbGVjdGVkX290aGVyLmN1cnJlbmN5JywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy52YWx1ZV9mbG93LmZlZXNfY29sbGVjdGVkX290aGVyWypdLmN1cnJlbmN5JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy52YWx1ZV9mbG93LmZlZXNfY29sbGVjdGVkX290aGVyLnZhbHVlJywgeyB0eXBlOiAndWludDEwMjQnLCBwYXRoOiAnZG9jLnZhbHVlX2Zsb3cuZmVlc19jb2xsZWN0ZWRfb3RoZXJbKl0udmFsdWUnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLnZhbHVlX2Zsb3cuY3JlYXRlZCcsIHsgdHlwZTogJ3VpbnQxMDI0JywgcGF0aDogJ2RvYy52YWx1ZV9mbG93LmNyZWF0ZWQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLnZhbHVlX2Zsb3cuY3JlYXRlZF9vdGhlci5jdXJyZW5jeScsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MudmFsdWVfZmxvdy5jcmVhdGVkX290aGVyWypdLmN1cnJlbmN5JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy52YWx1ZV9mbG93LmNyZWF0ZWRfb3RoZXIudmFsdWUnLCB7IHR5cGU6ICd1aW50MTAyNCcsIHBhdGg6ICdkb2MudmFsdWVfZmxvdy5jcmVhdGVkX290aGVyWypdLnZhbHVlJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy52YWx1ZV9mbG93LmltcG9ydGVkJywgeyB0eXBlOiAndWludDEwMjQnLCBwYXRoOiAnZG9jLnZhbHVlX2Zsb3cuaW1wb3J0ZWQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLnZhbHVlX2Zsb3cuaW1wb3J0ZWRfb3RoZXIuY3VycmVuY3knLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLnZhbHVlX2Zsb3cuaW1wb3J0ZWRfb3RoZXJbKl0uY3VycmVuY3knIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLnZhbHVlX2Zsb3cuaW1wb3J0ZWRfb3RoZXIudmFsdWUnLCB7IHR5cGU6ICd1aW50MTAyNCcsIHBhdGg6ICdkb2MudmFsdWVfZmxvdy5pbXBvcnRlZF9vdGhlclsqXS52YWx1ZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MudmFsdWVfZmxvdy5mcm9tX3ByZXZfYmxrJywgeyB0eXBlOiAndWludDEwMjQnLCBwYXRoOiAnZG9jLnZhbHVlX2Zsb3cuZnJvbV9wcmV2X2JsaycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MudmFsdWVfZmxvdy5mcm9tX3ByZXZfYmxrX290aGVyLmN1cnJlbmN5JywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy52YWx1ZV9mbG93LmZyb21fcHJldl9ibGtfb3RoZXJbKl0uY3VycmVuY3knIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLnZhbHVlX2Zsb3cuZnJvbV9wcmV2X2Jsa19vdGhlci52YWx1ZScsIHsgdHlwZTogJ3VpbnQxMDI0JywgcGF0aDogJ2RvYy52YWx1ZV9mbG93LmZyb21fcHJldl9ibGtfb3RoZXJbKl0udmFsdWUnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLnZhbHVlX2Zsb3cubWludGVkJywgeyB0eXBlOiAndWludDEwMjQnLCBwYXRoOiAnZG9jLnZhbHVlX2Zsb3cubWludGVkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy52YWx1ZV9mbG93Lm1pbnRlZF9vdGhlci5jdXJyZW5jeScsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MudmFsdWVfZmxvdy5taW50ZWRfb3RoZXJbKl0uY3VycmVuY3knIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLnZhbHVlX2Zsb3cubWludGVkX290aGVyLnZhbHVlJywgeyB0eXBlOiAndWludDEwMjQnLCBwYXRoOiAnZG9jLnZhbHVlX2Zsb3cubWludGVkX290aGVyWypdLnZhbHVlJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy52YWx1ZV9mbG93LmZlZXNfaW1wb3J0ZWQnLCB7IHR5cGU6ICd1aW50MTAyNCcsIHBhdGg6ICdkb2MudmFsdWVfZmxvdy5mZWVzX2ltcG9ydGVkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy52YWx1ZV9mbG93LmZlZXNfaW1wb3J0ZWRfb3RoZXIuY3VycmVuY3knLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLnZhbHVlX2Zsb3cuZmVlc19pbXBvcnRlZF9vdGhlclsqXS5jdXJyZW5jeScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MudmFsdWVfZmxvdy5mZWVzX2ltcG9ydGVkX290aGVyLnZhbHVlJywgeyB0eXBlOiAndWludDEwMjQnLCBwYXRoOiAnZG9jLnZhbHVlX2Zsb3cuZmVlc19pbXBvcnRlZF9vdGhlclsqXS52YWx1ZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MuaW5fbXNnX2Rlc2NyLm1zZ19pZCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MuaW5fbXNnX2Rlc2NyWypdLm1zZ19pZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MuaW5fbXNnX2Rlc2NyLmlocl9mZWUnLCB7IHR5cGU6ICd1aW50MTAyNCcsIHBhdGg6ICdkb2MuaW5fbXNnX2Rlc2NyWypdLmlocl9mZWUnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLmluX21zZ19kZXNjci5wcm9vZl9jcmVhdGVkJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5pbl9tc2dfZGVzY3JbKl0ucHJvb2ZfY3JlYXRlZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MuaW5fbXNnX2Rlc2NyLmluX21zZy5tc2dfaWQnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLmluX21zZ19kZXNjclsqXS5pbl9tc2cubXNnX2lkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5pbl9tc2dfZGVzY3IuaW5fbXNnLm5leHRfYWRkcicsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MuaW5fbXNnX2Rlc2NyWypdLmluX21zZy5uZXh0X2FkZHInIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLmluX21zZ19kZXNjci5pbl9tc2cuY3VyX2FkZHInLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLmluX21zZ19kZXNjclsqXS5pbl9tc2cuY3VyX2FkZHInIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLmluX21zZ19kZXNjci5pbl9tc2cuZndkX2ZlZV9yZW1haW5pbmcnLCB7IHR5cGU6ICd1aW50MTAyNCcsIHBhdGg6ICdkb2MuaW5fbXNnX2Rlc2NyWypdLmluX21zZy5md2RfZmVlX3JlbWFpbmluZycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MuaW5fbXNnX2Rlc2NyLmZ3ZF9mZWUnLCB7IHR5cGU6ICd1aW50MTAyNCcsIHBhdGg6ICdkb2MuaW5fbXNnX2Rlc2NyWypdLmZ3ZF9mZWUnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLmluX21zZ19kZXNjci5vdXRfbXNnLm1zZ19pZCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MuaW5fbXNnX2Rlc2NyWypdLm91dF9tc2cubXNnX2lkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5pbl9tc2dfZGVzY3Iub3V0X21zZy5uZXh0X2FkZHInLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLmluX21zZ19kZXNjclsqXS5vdXRfbXNnLm5leHRfYWRkcicgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MuaW5fbXNnX2Rlc2NyLm91dF9tc2cuY3VyX2FkZHInLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLmluX21zZ19kZXNjclsqXS5vdXRfbXNnLmN1cl9hZGRyJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5pbl9tc2dfZGVzY3Iub3V0X21zZy5md2RfZmVlX3JlbWFpbmluZycsIHsgdHlwZTogJ3VpbnQxMDI0JywgcGF0aDogJ2RvYy5pbl9tc2dfZGVzY3JbKl0ub3V0X21zZy5md2RfZmVlX3JlbWFpbmluZycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MuaW5fbXNnX2Rlc2NyLnRyYW5zaXRfZmVlJywgeyB0eXBlOiAndWludDEwMjQnLCBwYXRoOiAnZG9jLmluX21zZ19kZXNjclsqXS50cmFuc2l0X2ZlZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MuaW5fbXNnX2Rlc2NyLnRyYW5zYWN0aW9uX2lkJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5pbl9tc2dfZGVzY3JbKl0udHJhbnNhY3Rpb25faWQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLmluX21zZ19kZXNjci5wcm9vZl9kZWxpdmVyZWQnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLmluX21zZ19kZXNjclsqXS5wcm9vZl9kZWxpdmVyZWQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLnJhbmRfc2VlZCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MucmFuZF9zZWVkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5vdXRfbXNnX2Rlc2NyLm1zZ19pZCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2Mub3V0X21zZ19kZXNjclsqXS5tc2dfaWQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm91dF9tc2dfZGVzY3IudHJhbnNhY3Rpb25faWQnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm91dF9tc2dfZGVzY3JbKl0udHJhbnNhY3Rpb25faWQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm91dF9tc2dfZGVzY3Iub3V0X21zZy5tc2dfaWQnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm91dF9tc2dfZGVzY3JbKl0ub3V0X21zZy5tc2dfaWQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm91dF9tc2dfZGVzY3Iub3V0X21zZy5uZXh0X2FkZHInLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm91dF9tc2dfZGVzY3JbKl0ub3V0X21zZy5uZXh0X2FkZHInIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm91dF9tc2dfZGVzY3Iub3V0X21zZy5jdXJfYWRkcicsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2Mub3V0X21zZ19kZXNjclsqXS5vdXRfbXNnLmN1cl9hZGRyJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5vdXRfbXNnX2Rlc2NyLm91dF9tc2cuZndkX2ZlZV9yZW1haW5pbmcnLCB7IHR5cGU6ICd1aW50MTAyNCcsIHBhdGg6ICdkb2Mub3V0X21zZ19kZXNjclsqXS5vdXRfbXNnLmZ3ZF9mZWVfcmVtYWluaW5nJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5vdXRfbXNnX2Rlc2NyLnJlaW1wb3J0Lm1zZ19pZCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2Mub3V0X21zZ19kZXNjclsqXS5yZWltcG9ydC5tc2dfaWQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm91dF9tc2dfZGVzY3IucmVpbXBvcnQuaWhyX2ZlZScsIHsgdHlwZTogJ3VpbnQxMDI0JywgcGF0aDogJ2RvYy5vdXRfbXNnX2Rlc2NyWypdLnJlaW1wb3J0Lmlocl9mZWUnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm91dF9tc2dfZGVzY3IucmVpbXBvcnQucHJvb2ZfY3JlYXRlZCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2Mub3V0X21zZ19kZXNjclsqXS5yZWltcG9ydC5wcm9vZl9jcmVhdGVkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5vdXRfbXNnX2Rlc2NyLnJlaW1wb3J0LmluX21zZy5tc2dfaWQnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm91dF9tc2dfZGVzY3JbKl0ucmVpbXBvcnQuaW5fbXNnLm1zZ19pZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3Mub3V0X21zZ19kZXNjci5yZWltcG9ydC5pbl9tc2cubmV4dF9hZGRyJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5vdXRfbXNnX2Rlc2NyWypdLnJlaW1wb3J0LmluX21zZy5uZXh0X2FkZHInIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm91dF9tc2dfZGVzY3IucmVpbXBvcnQuaW5fbXNnLmN1cl9hZGRyJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5vdXRfbXNnX2Rlc2NyWypdLnJlaW1wb3J0LmluX21zZy5jdXJfYWRkcicgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3Mub3V0X21zZ19kZXNjci5yZWltcG9ydC5pbl9tc2cuZndkX2ZlZV9yZW1haW5pbmcnLCB7IHR5cGU6ICd1aW50MTAyNCcsIHBhdGg6ICdkb2Mub3V0X21zZ19kZXNjclsqXS5yZWltcG9ydC5pbl9tc2cuZndkX2ZlZV9yZW1haW5pbmcnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm91dF9tc2dfZGVzY3IucmVpbXBvcnQuZndkX2ZlZScsIHsgdHlwZTogJ3VpbnQxMDI0JywgcGF0aDogJ2RvYy5vdXRfbXNnX2Rlc2NyWypdLnJlaW1wb3J0LmZ3ZF9mZWUnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm91dF9tc2dfZGVzY3IucmVpbXBvcnQub3V0X21zZy5tc2dfaWQnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm91dF9tc2dfZGVzY3JbKl0ucmVpbXBvcnQub3V0X21zZy5tc2dfaWQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm91dF9tc2dfZGVzY3IucmVpbXBvcnQub3V0X21zZy5uZXh0X2FkZHInLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm91dF9tc2dfZGVzY3JbKl0ucmVpbXBvcnQub3V0X21zZy5uZXh0X2FkZHInIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm91dF9tc2dfZGVzY3IucmVpbXBvcnQub3V0X21zZy5jdXJfYWRkcicsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2Mub3V0X21zZ19kZXNjclsqXS5yZWltcG9ydC5vdXRfbXNnLmN1cl9hZGRyJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5vdXRfbXNnX2Rlc2NyLnJlaW1wb3J0Lm91dF9tc2cuZndkX2ZlZV9yZW1haW5pbmcnLCB7IHR5cGU6ICd1aW50MTAyNCcsIHBhdGg6ICdkb2Mub3V0X21zZ19kZXNjclsqXS5yZWltcG9ydC5vdXRfbXNnLmZ3ZF9mZWVfcmVtYWluaW5nJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5vdXRfbXNnX2Rlc2NyLnJlaW1wb3J0LnRyYW5zaXRfZmVlJywgeyB0eXBlOiAndWludDEwMjQnLCBwYXRoOiAnZG9jLm91dF9tc2dfZGVzY3JbKl0ucmVpbXBvcnQudHJhbnNpdF9mZWUnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm91dF9tc2dfZGVzY3IucmVpbXBvcnQudHJhbnNhY3Rpb25faWQnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm91dF9tc2dfZGVzY3JbKl0ucmVpbXBvcnQudHJhbnNhY3Rpb25faWQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm91dF9tc2dfZGVzY3IucmVpbXBvcnQucHJvb2ZfZGVsaXZlcmVkJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5vdXRfbXNnX2Rlc2NyWypdLnJlaW1wb3J0LnByb29mX2RlbGl2ZXJlZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3Mub3V0X21zZ19kZXNjci5pbXBvcnRlZC5tc2dfaWQnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm91dF9tc2dfZGVzY3JbKl0uaW1wb3J0ZWQubXNnX2lkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5vdXRfbXNnX2Rlc2NyLmltcG9ydGVkLmlocl9mZWUnLCB7IHR5cGU6ICd1aW50MTAyNCcsIHBhdGg6ICdkb2Mub3V0X21zZ19kZXNjclsqXS5pbXBvcnRlZC5paHJfZmVlJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5vdXRfbXNnX2Rlc2NyLmltcG9ydGVkLnByb29mX2NyZWF0ZWQnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm91dF9tc2dfZGVzY3JbKl0uaW1wb3J0ZWQucHJvb2ZfY3JlYXRlZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3Mub3V0X21zZ19kZXNjci5pbXBvcnRlZC5pbl9tc2cubXNnX2lkJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5vdXRfbXNnX2Rlc2NyWypdLmltcG9ydGVkLmluX21zZy5tc2dfaWQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm91dF9tc2dfZGVzY3IuaW1wb3J0ZWQuaW5fbXNnLm5leHRfYWRkcicsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2Mub3V0X21zZ19kZXNjclsqXS5pbXBvcnRlZC5pbl9tc2cubmV4dF9hZGRyJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5vdXRfbXNnX2Rlc2NyLmltcG9ydGVkLmluX21zZy5jdXJfYWRkcicsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2Mub3V0X21zZ19kZXNjclsqXS5pbXBvcnRlZC5pbl9tc2cuY3VyX2FkZHInIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm91dF9tc2dfZGVzY3IuaW1wb3J0ZWQuaW5fbXNnLmZ3ZF9mZWVfcmVtYWluaW5nJywgeyB0eXBlOiAndWludDEwMjQnLCBwYXRoOiAnZG9jLm91dF9tc2dfZGVzY3JbKl0uaW1wb3J0ZWQuaW5fbXNnLmZ3ZF9mZWVfcmVtYWluaW5nJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5vdXRfbXNnX2Rlc2NyLmltcG9ydGVkLmZ3ZF9mZWUnLCB7IHR5cGU6ICd1aW50MTAyNCcsIHBhdGg6ICdkb2Mub3V0X21zZ19kZXNjclsqXS5pbXBvcnRlZC5md2RfZmVlJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5vdXRfbXNnX2Rlc2NyLmltcG9ydGVkLm91dF9tc2cubXNnX2lkJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5vdXRfbXNnX2Rlc2NyWypdLmltcG9ydGVkLm91dF9tc2cubXNnX2lkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5vdXRfbXNnX2Rlc2NyLmltcG9ydGVkLm91dF9tc2cubmV4dF9hZGRyJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5vdXRfbXNnX2Rlc2NyWypdLmltcG9ydGVkLm91dF9tc2cubmV4dF9hZGRyJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5vdXRfbXNnX2Rlc2NyLmltcG9ydGVkLm91dF9tc2cuY3VyX2FkZHInLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm91dF9tc2dfZGVzY3JbKl0uaW1wb3J0ZWQub3V0X21zZy5jdXJfYWRkcicgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3Mub3V0X21zZ19kZXNjci5pbXBvcnRlZC5vdXRfbXNnLmZ3ZF9mZWVfcmVtYWluaW5nJywgeyB0eXBlOiAndWludDEwMjQnLCBwYXRoOiAnZG9jLm91dF9tc2dfZGVzY3JbKl0uaW1wb3J0ZWQub3V0X21zZy5md2RfZmVlX3JlbWFpbmluZycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3Mub3V0X21zZ19kZXNjci5pbXBvcnRlZC50cmFuc2l0X2ZlZScsIHsgdHlwZTogJ3VpbnQxMDI0JywgcGF0aDogJ2RvYy5vdXRfbXNnX2Rlc2NyWypdLmltcG9ydGVkLnRyYW5zaXRfZmVlJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5vdXRfbXNnX2Rlc2NyLmltcG9ydGVkLnRyYW5zYWN0aW9uX2lkJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5vdXRfbXNnX2Rlc2NyWypdLmltcG9ydGVkLnRyYW5zYWN0aW9uX2lkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5vdXRfbXNnX2Rlc2NyLmltcG9ydGVkLnByb29mX2RlbGl2ZXJlZCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2Mub3V0X21zZ19kZXNjclsqXS5pbXBvcnRlZC5wcm9vZl9kZWxpdmVyZWQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm91dF9tc2dfZGVzY3IuaW1wb3J0X2Jsb2NrX2x0JywgeyB0eXBlOiAndWludDY0JywgcGF0aDogJ2RvYy5vdXRfbXNnX2Rlc2NyWypdLmltcG9ydF9ibG9ja19sdCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3Mub3V0X21zZ19kZXNjci5tc2dfZW52X2hhc2gnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm91dF9tc2dfZGVzY3JbKl0ubXNnX2Vudl9oYXNoJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5vdXRfbXNnX2Rlc2NyLm5leHRfd29ya2NoYWluJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5vdXRfbXNnX2Rlc2NyWypdLm5leHRfd29ya2NoYWluJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5vdXRfbXNnX2Rlc2NyLm5leHRfYWRkcl9wZngnLCB7IHR5cGU6ICd1aW50NjQnLCBwYXRoOiAnZG9jLm91dF9tc2dfZGVzY3JbKl0ubmV4dF9hZGRyX3BmeCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MuYWNjb3VudF9ibG9ja3MuYWNjb3VudF9hZGRyJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5hY2NvdW50X2Jsb2Nrc1sqXS5hY2NvdW50X2FkZHInIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLmFjY291bnRfYmxvY2tzLnRyYW5zYWN0aW9ucy5sdCcsIHsgdHlwZTogJ3VpbnQ2NCcsIHBhdGg6ICdkb2MuYWNjb3VudF9ibG9ja3NbKl0udHJhbnNhY3Rpb25zWyoqXS5sdCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MuYWNjb3VudF9ibG9ja3MudHJhbnNhY3Rpb25zLnRyYW5zYWN0aW9uX2lkJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5hY2NvdW50X2Jsb2Nrc1sqXS50cmFuc2FjdGlvbnNbKipdLnRyYW5zYWN0aW9uX2lkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5hY2NvdW50X2Jsb2Nrcy50cmFuc2FjdGlvbnMudG90YWxfZmVlcycsIHsgdHlwZTogJ3VpbnQxMDI0JywgcGF0aDogJ2RvYy5hY2NvdW50X2Jsb2Nrc1sqXS50cmFuc2FjdGlvbnNbKipdLnRvdGFsX2ZlZXMnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLmFjY291bnRfYmxvY2tzLnRyYW5zYWN0aW9ucy50b3RhbF9mZWVzX290aGVyLmN1cnJlbmN5JywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5hY2NvdW50X2Jsb2Nrc1sqXS50cmFuc2FjdGlvbnNbKipdLnRvdGFsX2ZlZXNfb3RoZXJbKioqXS5jdXJyZW5jeScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MuYWNjb3VudF9ibG9ja3MudHJhbnNhY3Rpb25zLnRvdGFsX2ZlZXNfb3RoZXIudmFsdWUnLCB7IHR5cGU6ICd1aW50MTAyNCcsIHBhdGg6ICdkb2MuYWNjb3VudF9ibG9ja3NbKl0udHJhbnNhY3Rpb25zWyoqXS50b3RhbF9mZWVzX290aGVyWyoqKl0udmFsdWUnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLmFjY291bnRfYmxvY2tzLm9sZF9oYXNoJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5hY2NvdW50X2Jsb2Nrc1sqXS5vbGRfaGFzaCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MuYWNjb3VudF9ibG9ja3MubmV3X2hhc2gnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLmFjY291bnRfYmxvY2tzWypdLm5ld19oYXNoJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5hY2NvdW50X2Jsb2Nrcy50cl9jb3VudCcsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MuYWNjb3VudF9ibG9ja3NbKl0udHJfY291bnQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLnRyX2NvdW50JywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy50cl9jb3VudCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3Muc3RhdGVfdXBkYXRlLm5ldycsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2Muc3RhdGVfdXBkYXRlLm5ldycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3Muc3RhdGVfdXBkYXRlLm5ld19oYXNoJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5zdGF0ZV91cGRhdGUubmV3X2hhc2gnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLnN0YXRlX3VwZGF0ZS5uZXdfZGVwdGgnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLnN0YXRlX3VwZGF0ZS5uZXdfZGVwdGgnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLnN0YXRlX3VwZGF0ZS5vbGQnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLnN0YXRlX3VwZGF0ZS5vbGQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLnN0YXRlX3VwZGF0ZS5vbGRfaGFzaCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2Muc3RhdGVfdXBkYXRlLm9sZF9oYXNoJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5zdGF0ZV91cGRhdGUub2xkX2RlcHRoJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5zdGF0ZV91cGRhdGUub2xkX2RlcHRoJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIubWluX3NoYXJkX2dlbl91dGltZScsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLm1pbl9zaGFyZF9nZW5fdXRpbWUnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5tYXhfc2hhcmRfZ2VuX3V0aW1lJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIubWF4X3NoYXJkX2dlbl91dGltZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLnNoYXJkX2hhc2hlcy53b3JrY2hhaW5faWQnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5zaGFyZF9oYXNoZXNbKl0ud29ya2NoYWluX2lkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuc2hhcmRfaGFzaGVzLnNoYXJkJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5tYXN0ZXIuc2hhcmRfaGFzaGVzWypdLnNoYXJkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuc2hhcmRfaGFzaGVzLmRlc2NyLnNlcV9ubycsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLnNoYXJkX2hhc2hlc1sqXS5kZXNjci5zZXFfbm8nIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5zaGFyZF9oYXNoZXMuZGVzY3IucmVnX21jX3NlcW5vJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuc2hhcmRfaGFzaGVzWypdLmRlc2NyLnJlZ19tY19zZXFubycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLnNoYXJkX2hhc2hlcy5kZXNjci5zdGFydF9sdCcsIHsgdHlwZTogJ3VpbnQ2NCcsIHBhdGg6ICdkb2MubWFzdGVyLnNoYXJkX2hhc2hlc1sqXS5kZXNjci5zdGFydF9sdCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLnNoYXJkX2hhc2hlcy5kZXNjci5lbmRfbHQnLCB7IHR5cGU6ICd1aW50NjQnLCBwYXRoOiAnZG9jLm1hc3Rlci5zaGFyZF9oYXNoZXNbKl0uZGVzY3IuZW5kX2x0JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuc2hhcmRfaGFzaGVzLmRlc2NyLnJvb3RfaGFzaCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MubWFzdGVyLnNoYXJkX2hhc2hlc1sqXS5kZXNjci5yb290X2hhc2gnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5zaGFyZF9oYXNoZXMuZGVzY3IuZmlsZV9oYXNoJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5tYXN0ZXIuc2hhcmRfaGFzaGVzWypdLmRlc2NyLmZpbGVfaGFzaCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLnNoYXJkX2hhc2hlcy5kZXNjci5iZWZvcmVfc3BsaXQnLCB7IHR5cGU6ICdib29sZWFuJywgcGF0aDogJ2RvYy5tYXN0ZXIuc2hhcmRfaGFzaGVzWypdLmRlc2NyLmJlZm9yZV9zcGxpdCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLnNoYXJkX2hhc2hlcy5kZXNjci5iZWZvcmVfbWVyZ2UnLCB7IHR5cGU6ICdib29sZWFuJywgcGF0aDogJ2RvYy5tYXN0ZXIuc2hhcmRfaGFzaGVzWypdLmRlc2NyLmJlZm9yZV9tZXJnZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLnNoYXJkX2hhc2hlcy5kZXNjci53YW50X3NwbGl0JywgeyB0eXBlOiAnYm9vbGVhbicsIHBhdGg6ICdkb2MubWFzdGVyLnNoYXJkX2hhc2hlc1sqXS5kZXNjci53YW50X3NwbGl0JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuc2hhcmRfaGFzaGVzLmRlc2NyLndhbnRfbWVyZ2UnLCB7IHR5cGU6ICdib29sZWFuJywgcGF0aDogJ2RvYy5tYXN0ZXIuc2hhcmRfaGFzaGVzWypdLmRlc2NyLndhbnRfbWVyZ2UnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5zaGFyZF9oYXNoZXMuZGVzY3IubnhfY2NfdXBkYXRlZCcsIHsgdHlwZTogJ2Jvb2xlYW4nLCBwYXRoOiAnZG9jLm1hc3Rlci5zaGFyZF9oYXNoZXNbKl0uZGVzY3IubnhfY2NfdXBkYXRlZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLnNoYXJkX2hhc2hlcy5kZXNjci5mbGFncycsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLnNoYXJkX2hhc2hlc1sqXS5kZXNjci5mbGFncycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLnNoYXJkX2hhc2hlcy5kZXNjci5uZXh0X2NhdGNoYWluX3NlcW5vJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuc2hhcmRfaGFzaGVzWypdLmRlc2NyLm5leHRfY2F0Y2hhaW5fc2Vxbm8nIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5zaGFyZF9oYXNoZXMuZGVzY3IubmV4dF92YWxpZGF0b3Jfc2hhcmQnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm1hc3Rlci5zaGFyZF9oYXNoZXNbKl0uZGVzY3IubmV4dF92YWxpZGF0b3Jfc2hhcmQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5zaGFyZF9oYXNoZXMuZGVzY3IubWluX3JlZl9tY19zZXFubycsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLnNoYXJkX2hhc2hlc1sqXS5kZXNjci5taW5fcmVmX21jX3NlcW5vJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuc2hhcmRfaGFzaGVzLmRlc2NyLmdlbl91dGltZScsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLnNoYXJkX2hhc2hlc1sqXS5kZXNjci5nZW5fdXRpbWUnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5zaGFyZF9oYXNoZXMuZGVzY3Iuc3BsaXQnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5zaGFyZF9oYXNoZXNbKl0uZGVzY3Iuc3BsaXQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5zaGFyZF9oYXNoZXMuZGVzY3IuZmVlc19jb2xsZWN0ZWQnLCB7IHR5cGU6ICd1aW50MTAyNCcsIHBhdGg6ICdkb2MubWFzdGVyLnNoYXJkX2hhc2hlc1sqXS5kZXNjci5mZWVzX2NvbGxlY3RlZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLnNoYXJkX2hhc2hlcy5kZXNjci5mZWVzX2NvbGxlY3RlZF9vdGhlci5jdXJyZW5jeScsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLnNoYXJkX2hhc2hlc1sqXS5kZXNjci5mZWVzX2NvbGxlY3RlZF9vdGhlclsqKl0uY3VycmVuY3knIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5zaGFyZF9oYXNoZXMuZGVzY3IuZmVlc19jb2xsZWN0ZWRfb3RoZXIudmFsdWUnLCB7IHR5cGU6ICd1aW50MTAyNCcsIHBhdGg6ICdkb2MubWFzdGVyLnNoYXJkX2hhc2hlc1sqXS5kZXNjci5mZWVzX2NvbGxlY3RlZF9vdGhlclsqKl0udmFsdWUnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5zaGFyZF9oYXNoZXMuZGVzY3IuZnVuZHNfY3JlYXRlZCcsIHsgdHlwZTogJ3VpbnQxMDI0JywgcGF0aDogJ2RvYy5tYXN0ZXIuc2hhcmRfaGFzaGVzWypdLmRlc2NyLmZ1bmRzX2NyZWF0ZWQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5zaGFyZF9oYXNoZXMuZGVzY3IuZnVuZHNfY3JlYXRlZF9vdGhlci5jdXJyZW5jeScsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLnNoYXJkX2hhc2hlc1sqXS5kZXNjci5mdW5kc19jcmVhdGVkX290aGVyWyoqXS5jdXJyZW5jeScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLnNoYXJkX2hhc2hlcy5kZXNjci5mdW5kc19jcmVhdGVkX290aGVyLnZhbHVlJywgeyB0eXBlOiAndWludDEwMjQnLCBwYXRoOiAnZG9jLm1hc3Rlci5zaGFyZF9oYXNoZXNbKl0uZGVzY3IuZnVuZHNfY3JlYXRlZF9vdGhlclsqKl0udmFsdWUnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5zaGFyZF9mZWVzLndvcmtjaGFpbl9pZCcsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLnNoYXJkX2ZlZXNbKl0ud29ya2NoYWluX2lkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuc2hhcmRfZmVlcy5zaGFyZCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MubWFzdGVyLnNoYXJkX2ZlZXNbKl0uc2hhcmQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5zaGFyZF9mZWVzLmZlZXMnLCB7IHR5cGU6ICd1aW50MTAyNCcsIHBhdGg6ICdkb2MubWFzdGVyLnNoYXJkX2ZlZXNbKl0uZmVlcycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLnNoYXJkX2ZlZXMuZmVlc19vdGhlci5jdXJyZW5jeScsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLnNoYXJkX2ZlZXNbKl0uZmVlc19vdGhlclsqKl0uY3VycmVuY3knIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5zaGFyZF9mZWVzLmZlZXNfb3RoZXIudmFsdWUnLCB7IHR5cGU6ICd1aW50MTAyNCcsIHBhdGg6ICdkb2MubWFzdGVyLnNoYXJkX2ZlZXNbKl0uZmVlc19vdGhlclsqKl0udmFsdWUnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5zaGFyZF9mZWVzLmNyZWF0ZScsIHsgdHlwZTogJ3VpbnQxMDI0JywgcGF0aDogJ2RvYy5tYXN0ZXIuc2hhcmRfZmVlc1sqXS5jcmVhdGUnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5zaGFyZF9mZWVzLmNyZWF0ZV9vdGhlci5jdXJyZW5jeScsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLnNoYXJkX2ZlZXNbKl0uY3JlYXRlX290aGVyWyoqXS5jdXJyZW5jeScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLnNoYXJkX2ZlZXMuY3JlYXRlX290aGVyLnZhbHVlJywgeyB0eXBlOiAndWludDEwMjQnLCBwYXRoOiAnZG9jLm1hc3Rlci5zaGFyZF9mZWVzWypdLmNyZWF0ZV9vdGhlclsqKl0udmFsdWUnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5yZWNvdmVyX2NyZWF0ZV9tc2cubXNnX2lkJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5tYXN0ZXIucmVjb3Zlcl9jcmVhdGVfbXNnLm1zZ19pZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLnJlY292ZXJfY3JlYXRlX21zZy5paHJfZmVlJywgeyB0eXBlOiAndWludDEwMjQnLCBwYXRoOiAnZG9jLm1hc3Rlci5yZWNvdmVyX2NyZWF0ZV9tc2cuaWhyX2ZlZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLnJlY292ZXJfY3JlYXRlX21zZy5wcm9vZl9jcmVhdGVkJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5tYXN0ZXIucmVjb3Zlcl9jcmVhdGVfbXNnLnByb29mX2NyZWF0ZWQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5yZWNvdmVyX2NyZWF0ZV9tc2cuaW5fbXNnLm1zZ19pZCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MubWFzdGVyLnJlY292ZXJfY3JlYXRlX21zZy5pbl9tc2cubXNnX2lkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIucmVjb3Zlcl9jcmVhdGVfbXNnLmluX21zZy5uZXh0X2FkZHInLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm1hc3Rlci5yZWNvdmVyX2NyZWF0ZV9tc2cuaW5fbXNnLm5leHRfYWRkcicgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLnJlY292ZXJfY3JlYXRlX21zZy5pbl9tc2cuY3VyX2FkZHInLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm1hc3Rlci5yZWNvdmVyX2NyZWF0ZV9tc2cuaW5fbXNnLmN1cl9hZGRyJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIucmVjb3Zlcl9jcmVhdGVfbXNnLmluX21zZy5md2RfZmVlX3JlbWFpbmluZycsIHsgdHlwZTogJ3VpbnQxMDI0JywgcGF0aDogJ2RvYy5tYXN0ZXIucmVjb3Zlcl9jcmVhdGVfbXNnLmluX21zZy5md2RfZmVlX3JlbWFpbmluZycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLnJlY292ZXJfY3JlYXRlX21zZy5md2RfZmVlJywgeyB0eXBlOiAndWludDEwMjQnLCBwYXRoOiAnZG9jLm1hc3Rlci5yZWNvdmVyX2NyZWF0ZV9tc2cuZndkX2ZlZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLnJlY292ZXJfY3JlYXRlX21zZy5vdXRfbXNnLm1zZ19pZCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MubWFzdGVyLnJlY292ZXJfY3JlYXRlX21zZy5vdXRfbXNnLm1zZ19pZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLnJlY292ZXJfY3JlYXRlX21zZy5vdXRfbXNnLm5leHRfYWRkcicsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MubWFzdGVyLnJlY292ZXJfY3JlYXRlX21zZy5vdXRfbXNnLm5leHRfYWRkcicgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLnJlY292ZXJfY3JlYXRlX21zZy5vdXRfbXNnLmN1cl9hZGRyJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5tYXN0ZXIucmVjb3Zlcl9jcmVhdGVfbXNnLm91dF9tc2cuY3VyX2FkZHInIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5yZWNvdmVyX2NyZWF0ZV9tc2cub3V0X21zZy5md2RfZmVlX3JlbWFpbmluZycsIHsgdHlwZTogJ3VpbnQxMDI0JywgcGF0aDogJ2RvYy5tYXN0ZXIucmVjb3Zlcl9jcmVhdGVfbXNnLm91dF9tc2cuZndkX2ZlZV9yZW1haW5pbmcnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5yZWNvdmVyX2NyZWF0ZV9tc2cudHJhbnNpdF9mZWUnLCB7IHR5cGU6ICd1aW50MTAyNCcsIHBhdGg6ICdkb2MubWFzdGVyLnJlY292ZXJfY3JlYXRlX21zZy50cmFuc2l0X2ZlZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLnJlY292ZXJfY3JlYXRlX21zZy50cmFuc2FjdGlvbl9pZCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MubWFzdGVyLnJlY292ZXJfY3JlYXRlX21zZy50cmFuc2FjdGlvbl9pZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLnJlY292ZXJfY3JlYXRlX21zZy5wcm9vZl9kZWxpdmVyZWQnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm1hc3Rlci5yZWNvdmVyX2NyZWF0ZV9tc2cucHJvb2ZfZGVsaXZlcmVkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIucHJldl9ibGtfc2lnbmF0dXJlcy5ub2RlX2lkJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5tYXN0ZXIucHJldl9ibGtfc2lnbmF0dXJlc1sqXS5ub2RlX2lkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIucHJldl9ibGtfc2lnbmF0dXJlcy5yJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5tYXN0ZXIucHJldl9ibGtfc2lnbmF0dXJlc1sqXS5yJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIucHJldl9ibGtfc2lnbmF0dXJlcy5zJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5tYXN0ZXIucHJldl9ibGtfc2lnbmF0dXJlc1sqXS5zJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnX2FkZHInLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWdfYWRkcicgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMScsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMicsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMicgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMycsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wNCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wNCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wNi5taW50X25ld19wcmljZScsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wNi5taW50X25ld19wcmljZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wNi5taW50X2FkZF9wcmljZScsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wNi5taW50X2FkZF9wcmljZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wNy5jdXJyZW5jeScsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wN1sqXS5jdXJyZW5jeScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wNy52YWx1ZScsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wN1sqXS52YWx1ZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wOC52ZXJzaW9uJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnA4LnZlcnNpb24nIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDguY2FwYWJpbGl0aWVzJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnA4LmNhcGFiaWxpdGllcycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wOScsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wOVsqXScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMTAnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDEwWypdJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAxMS5ub3JtYWxfcGFyYW1zLm1pbl90b3Rfcm91bmRzJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAxMS5ub3JtYWxfcGFyYW1zLm1pbl90b3Rfcm91bmRzJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAxMS5ub3JtYWxfcGFyYW1zLm1heF90b3Rfcm91bmRzJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAxMS5ub3JtYWxfcGFyYW1zLm1heF90b3Rfcm91bmRzJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAxMS5ub3JtYWxfcGFyYW1zLm1pbl93aW5zJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAxMS5ub3JtYWxfcGFyYW1zLm1pbl93aW5zJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAxMS5ub3JtYWxfcGFyYW1zLm1heF9sb3NzZXMnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDExLm5vcm1hbF9wYXJhbXMubWF4X2xvc3NlcycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMTEubm9ybWFsX3BhcmFtcy5taW5fc3RvcmVfc2VjJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAxMS5ub3JtYWxfcGFyYW1zLm1pbl9zdG9yZV9zZWMnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDExLm5vcm1hbF9wYXJhbXMubWF4X3N0b3JlX3NlYycsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMTEubm9ybWFsX3BhcmFtcy5tYXhfc3RvcmVfc2VjJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAxMS5ub3JtYWxfcGFyYW1zLmJpdF9wcmljZScsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMTEubm9ybWFsX3BhcmFtcy5iaXRfcHJpY2UnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDExLm5vcm1hbF9wYXJhbXMuY2VsbF9wcmljZScsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMTEubm9ybWFsX3BhcmFtcy5jZWxsX3ByaWNlJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAxMS5jcml0aWNhbF9wYXJhbXMubWluX3RvdF9yb3VuZHMnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDExLmNyaXRpY2FsX3BhcmFtcy5taW5fdG90X3JvdW5kcycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMTEuY3JpdGljYWxfcGFyYW1zLm1heF90b3Rfcm91bmRzJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAxMS5jcml0aWNhbF9wYXJhbXMubWF4X3RvdF9yb3VuZHMnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDExLmNyaXRpY2FsX3BhcmFtcy5taW5fd2lucycsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMTEuY3JpdGljYWxfcGFyYW1zLm1pbl93aW5zJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAxMS5jcml0aWNhbF9wYXJhbXMubWF4X2xvc3NlcycsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMTEuY3JpdGljYWxfcGFyYW1zLm1heF9sb3NzZXMnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDExLmNyaXRpY2FsX3BhcmFtcy5taW5fc3RvcmVfc2VjJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAxMS5jcml0aWNhbF9wYXJhbXMubWluX3N0b3JlX3NlYycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMTEuY3JpdGljYWxfcGFyYW1zLm1heF9zdG9yZV9zZWMnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDExLmNyaXRpY2FsX3BhcmFtcy5tYXhfc3RvcmVfc2VjJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAxMS5jcml0aWNhbF9wYXJhbXMuYml0X3ByaWNlJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAxMS5jcml0aWNhbF9wYXJhbXMuYml0X3ByaWNlJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAxMS5jcml0aWNhbF9wYXJhbXMuY2VsbF9wcmljZScsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMTEuY3JpdGljYWxfcGFyYW1zLmNlbGxfcHJpY2UnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDEyLndvcmtjaGFpbl9pZCcsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMTJbKl0ud29ya2NoYWluX2lkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAxMi5lbmFibGVkX3NpbmNlJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAxMlsqXS5lbmFibGVkX3NpbmNlJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAxMi5hY3R1YWxfbWluX3NwbGl0JywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAxMlsqXS5hY3R1YWxfbWluX3NwbGl0JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAxMi5taW5fc3BsaXQnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDEyWypdLm1pbl9zcGxpdCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMTIubWF4X3NwbGl0JywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAxMlsqXS5tYXhfc3BsaXQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDEyLmFjdGl2ZScsIHsgdHlwZTogJ2Jvb2xlYW4nLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDEyWypdLmFjdGl2ZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMTIuYWNjZXB0X21zZ3MnLCB7IHR5cGU6ICdib29sZWFuJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAxMlsqXS5hY2NlcHRfbXNncycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMTIuZmxhZ3MnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDEyWypdLmZsYWdzJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAxMi56ZXJvc3RhdGVfcm9vdF9oYXNoJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAxMlsqXS56ZXJvc3RhdGVfcm9vdF9oYXNoJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAxMi56ZXJvc3RhdGVfZmlsZV9oYXNoJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAxMlsqXS56ZXJvc3RhdGVfZmlsZV9oYXNoJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAxMi52ZXJzaW9uJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAxMlsqXS52ZXJzaW9uJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAxMi5iYXNpYycsIHsgdHlwZTogJ2Jvb2xlYW4nLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDEyWypdLmJhc2ljJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAxMi52bV92ZXJzaW9uJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAxMlsqXS52bV92ZXJzaW9uJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAxMi52bV9tb2RlJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAxMlsqXS52bV9tb2RlJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAxMi5taW5fYWRkcl9sZW4nLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDEyWypdLm1pbl9hZGRyX2xlbicgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMTIubWF4X2FkZHJfbGVuJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAxMlsqXS5tYXhfYWRkcl9sZW4nIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDEyLmFkZHJfbGVuX3N0ZXAnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDEyWypdLmFkZHJfbGVuX3N0ZXAnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDEyLndvcmtjaGFpbl90eXBlX2lkJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAxMlsqXS53b3JrY2hhaW5fdHlwZV9pZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMTQubWFzdGVyY2hhaW5fYmxvY2tfZmVlJywgeyB0eXBlOiAndWludDEwMjQnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDE0Lm1hc3RlcmNoYWluX2Jsb2NrX2ZlZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMTQuYmFzZWNoYWluX2Jsb2NrX2ZlZScsIHsgdHlwZTogJ3VpbnQxMDI0JywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAxNC5iYXNlY2hhaW5fYmxvY2tfZmVlJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAxNS52YWxpZGF0b3JzX2VsZWN0ZWRfZm9yJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAxNS52YWxpZGF0b3JzX2VsZWN0ZWRfZm9yJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAxNS5lbGVjdGlvbnNfc3RhcnRfYmVmb3JlJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAxNS5lbGVjdGlvbnNfc3RhcnRfYmVmb3JlJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAxNS5lbGVjdGlvbnNfZW5kX2JlZm9yZScsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMTUuZWxlY3Rpb25zX2VuZF9iZWZvcmUnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDE1LnN0YWtlX2hlbGRfZm9yJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAxNS5zdGFrZV9oZWxkX2ZvcicgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMTYubWF4X3ZhbGlkYXRvcnMnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDE2Lm1heF92YWxpZGF0b3JzJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAxNi5tYXhfbWFpbl92YWxpZGF0b3JzJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAxNi5tYXhfbWFpbl92YWxpZGF0b3JzJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAxNi5taW5fdmFsaWRhdG9ycycsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMTYubWluX3ZhbGlkYXRvcnMnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDE3Lm1pbl9zdGFrZScsIHsgdHlwZTogJ3VpbnQxMDI0JywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAxNy5taW5fc3Rha2UnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDE3Lm1heF9zdGFrZScsIHsgdHlwZTogJ3VpbnQxMDI0JywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAxNy5tYXhfc3Rha2UnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDE3Lm1pbl90b3RhbF9zdGFrZScsIHsgdHlwZTogJ3VpbnQxMDI0JywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAxNy5taW5fdG90YWxfc3Rha2UnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDE3Lm1heF9zdGFrZV9mYWN0b3InLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDE3Lm1heF9zdGFrZV9mYWN0b3InIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDE4LnV0aW1lX3NpbmNlJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAxOFsqXS51dGltZV9zaW5jZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMTguYml0X3ByaWNlX3BzJywgeyB0eXBlOiAndWludDY0JywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAxOFsqXS5iaXRfcHJpY2VfcHMnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDE4LmNlbGxfcHJpY2VfcHMnLCB7IHR5cGU6ICd1aW50NjQnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDE4WypdLmNlbGxfcHJpY2VfcHMnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDE4Lm1jX2JpdF9wcmljZV9wcycsIHsgdHlwZTogJ3VpbnQ2NCcsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMThbKl0ubWNfYml0X3ByaWNlX3BzJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAxOC5tY19jZWxsX3ByaWNlX3BzJywgeyB0eXBlOiAndWludDY0JywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAxOFsqXS5tY19jZWxsX3ByaWNlX3BzJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAyMC5nYXNfcHJpY2UnLCB7IHR5cGU6ICd1aW50NjQnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDIwLmdhc19wcmljZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMjAuZ2FzX2xpbWl0JywgeyB0eXBlOiAndWludDY0JywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAyMC5nYXNfbGltaXQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDIwLnNwZWNpYWxfZ2FzX2xpbWl0JywgeyB0eXBlOiAndWludDY0JywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAyMC5zcGVjaWFsX2dhc19saW1pdCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMjAuZ2FzX2NyZWRpdCcsIHsgdHlwZTogJ3VpbnQ2NCcsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMjAuZ2FzX2NyZWRpdCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMjAuYmxvY2tfZ2FzX2xpbWl0JywgeyB0eXBlOiAndWludDY0JywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAyMC5ibG9ja19nYXNfbGltaXQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDIwLmZyZWV6ZV9kdWVfbGltaXQnLCB7IHR5cGU6ICd1aW50NjQnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDIwLmZyZWV6ZV9kdWVfbGltaXQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDIwLmRlbGV0ZV9kdWVfbGltaXQnLCB7IHR5cGU6ICd1aW50NjQnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDIwLmRlbGV0ZV9kdWVfbGltaXQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDIwLmZsYXRfZ2FzX2xpbWl0JywgeyB0eXBlOiAndWludDY0JywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAyMC5mbGF0X2dhc19saW1pdCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMjAuZmxhdF9nYXNfcHJpY2UnLCB7IHR5cGU6ICd1aW50NjQnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDIwLmZsYXRfZ2FzX3ByaWNlJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAyMS5nYXNfcHJpY2UnLCB7IHR5cGU6ICd1aW50NjQnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDIxLmdhc19wcmljZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMjEuZ2FzX2xpbWl0JywgeyB0eXBlOiAndWludDY0JywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAyMS5nYXNfbGltaXQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDIxLnNwZWNpYWxfZ2FzX2xpbWl0JywgeyB0eXBlOiAndWludDY0JywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAyMS5zcGVjaWFsX2dhc19saW1pdCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMjEuZ2FzX2NyZWRpdCcsIHsgdHlwZTogJ3VpbnQ2NCcsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMjEuZ2FzX2NyZWRpdCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMjEuYmxvY2tfZ2FzX2xpbWl0JywgeyB0eXBlOiAndWludDY0JywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAyMS5ibG9ja19nYXNfbGltaXQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDIxLmZyZWV6ZV9kdWVfbGltaXQnLCB7IHR5cGU6ICd1aW50NjQnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDIxLmZyZWV6ZV9kdWVfbGltaXQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDIxLmRlbGV0ZV9kdWVfbGltaXQnLCB7IHR5cGU6ICd1aW50NjQnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDIxLmRlbGV0ZV9kdWVfbGltaXQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDIxLmZsYXRfZ2FzX2xpbWl0JywgeyB0eXBlOiAndWludDY0JywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAyMS5mbGF0X2dhc19saW1pdCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMjEuZmxhdF9nYXNfcHJpY2UnLCB7IHR5cGU6ICd1aW50NjQnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDIxLmZsYXRfZ2FzX3ByaWNlJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAyMi5ieXRlcy51bmRlcmxvYWQnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDIyLmJ5dGVzLnVuZGVybG9hZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMjIuYnl0ZXMuc29mdF9saW1pdCcsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMjIuYnl0ZXMuc29mdF9saW1pdCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMjIuYnl0ZXMuaGFyZF9saW1pdCcsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMjIuYnl0ZXMuaGFyZF9saW1pdCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMjIuZ2FzLnVuZGVybG9hZCcsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMjIuZ2FzLnVuZGVybG9hZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMjIuZ2FzLnNvZnRfbGltaXQnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDIyLmdhcy5zb2Z0X2xpbWl0JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAyMi5nYXMuaGFyZF9saW1pdCcsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMjIuZ2FzLmhhcmRfbGltaXQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDIyLmx0X2RlbHRhLnVuZGVybG9hZCcsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMjIubHRfZGVsdGEudW5kZXJsb2FkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAyMi5sdF9kZWx0YS5zb2Z0X2xpbWl0JywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAyMi5sdF9kZWx0YS5zb2Z0X2xpbWl0JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAyMi5sdF9kZWx0YS5oYXJkX2xpbWl0JywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAyMi5sdF9kZWx0YS5oYXJkX2xpbWl0JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAyMy5ieXRlcy51bmRlcmxvYWQnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDIzLmJ5dGVzLnVuZGVybG9hZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMjMuYnl0ZXMuc29mdF9saW1pdCcsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMjMuYnl0ZXMuc29mdF9saW1pdCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMjMuYnl0ZXMuaGFyZF9saW1pdCcsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMjMuYnl0ZXMuaGFyZF9saW1pdCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMjMuZ2FzLnVuZGVybG9hZCcsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMjMuZ2FzLnVuZGVybG9hZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMjMuZ2FzLnNvZnRfbGltaXQnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDIzLmdhcy5zb2Z0X2xpbWl0JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAyMy5nYXMuaGFyZF9saW1pdCcsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMjMuZ2FzLmhhcmRfbGltaXQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDIzLmx0X2RlbHRhLnVuZGVybG9hZCcsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMjMubHRfZGVsdGEudW5kZXJsb2FkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAyMy5sdF9kZWx0YS5zb2Z0X2xpbWl0JywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAyMy5sdF9kZWx0YS5zb2Z0X2xpbWl0JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAyMy5sdF9kZWx0YS5oYXJkX2xpbWl0JywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAyMy5sdF9kZWx0YS5oYXJkX2xpbWl0JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAyNC5sdW1wX3ByaWNlJywgeyB0eXBlOiAndWludDY0JywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAyNC5sdW1wX3ByaWNlJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAyNC5iaXRfcHJpY2UnLCB7IHR5cGU6ICd1aW50NjQnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDI0LmJpdF9wcmljZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMjQuY2VsbF9wcmljZScsIHsgdHlwZTogJ3VpbnQ2NCcsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMjQuY2VsbF9wcmljZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMjQuaWhyX3ByaWNlX2ZhY3RvcicsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMjQuaWhyX3ByaWNlX2ZhY3RvcicgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMjQuZmlyc3RfZnJhYycsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMjQuZmlyc3RfZnJhYycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMjQubmV4dF9mcmFjJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAyNC5uZXh0X2ZyYWMnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDI1Lmx1bXBfcHJpY2UnLCB7IHR5cGU6ICd1aW50NjQnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDI1Lmx1bXBfcHJpY2UnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDI1LmJpdF9wcmljZScsIHsgdHlwZTogJ3VpbnQ2NCcsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMjUuYml0X3ByaWNlJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAyNS5jZWxsX3ByaWNlJywgeyB0eXBlOiAndWludDY0JywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAyNS5jZWxsX3ByaWNlJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAyNS5paHJfcHJpY2VfZmFjdG9yJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAyNS5paHJfcHJpY2VfZmFjdG9yJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAyNS5maXJzdF9mcmFjJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAyNS5maXJzdF9mcmFjJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAyNS5uZXh0X2ZyYWMnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDI1Lm5leHRfZnJhYycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMjguc2h1ZmZsZV9tY192YWxpZGF0b3JzJywgeyB0eXBlOiAnYm9vbGVhbicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMjguc2h1ZmZsZV9tY192YWxpZGF0b3JzJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAyOC5tY19jYXRjaGFpbl9saWZldGltZScsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMjgubWNfY2F0Y2hhaW5fbGlmZXRpbWUnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDI4LnNoYXJkX2NhdGNoYWluX2xpZmV0aW1lJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAyOC5zaGFyZF9jYXRjaGFpbl9saWZldGltZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMjguc2hhcmRfdmFsaWRhdG9yc19saWZldGltZScsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMjguc2hhcmRfdmFsaWRhdG9yc19saWZldGltZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMjguc2hhcmRfdmFsaWRhdG9yc19udW0nLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDI4LnNoYXJkX3ZhbGlkYXRvcnNfbnVtJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAyOS5uZXdfY2F0Y2hhaW5faWRzJywgeyB0eXBlOiAnYm9vbGVhbicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMjkubmV3X2NhdGNoYWluX2lkcycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMjkucm91bmRfY2FuZGlkYXRlcycsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMjkucm91bmRfY2FuZGlkYXRlcycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMjkubmV4dF9jYW5kaWRhdGVfZGVsYXlfbXMnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDI5Lm5leHRfY2FuZGlkYXRlX2RlbGF5X21zJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAyOS5jb25zZW5zdXNfdGltZW91dF9tcycsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMjkuY29uc2Vuc3VzX3RpbWVvdXRfbXMnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDI5LmZhc3RfYXR0ZW1wdHMnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDI5LmZhc3RfYXR0ZW1wdHMnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDI5LmF0dGVtcHRfZHVyYXRpb24nLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDI5LmF0dGVtcHRfZHVyYXRpb24nIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDI5LmNhdGNoYWluX21heF9kZXBzJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAyOS5jYXRjaGFpbl9tYXhfZGVwcycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMjkubWF4X2Jsb2NrX2J5dGVzJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAyOS5tYXhfYmxvY2tfYnl0ZXMnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDI5Lm1heF9jb2xsYXRlZF9ieXRlcycsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMjkubWF4X2NvbGxhdGVkX2J5dGVzJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAzMScsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMzFbKl0nIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDMyLnV0aW1lX3NpbmNlJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAzMi51dGltZV9zaW5jZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMzIudXRpbWVfdW50aWwnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDMyLnV0aW1lX3VudGlsJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAzMi50b3RhbCcsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMzIudG90YWwnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDMyLnRvdGFsX3dlaWdodCcsIHsgdHlwZTogJ3VpbnQ2NCcsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMzIudG90YWxfd2VpZ2h0JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAzMi5saXN0LnB1YmxpY19rZXknLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDMyLmxpc3RbKl0ucHVibGljX2tleScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMzIubGlzdC53ZWlnaHQnLCB7IHR5cGU6ICd1aW50NjQnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDMyLmxpc3RbKl0ud2VpZ2h0JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAzMi5saXN0LmFkbmxfYWRkcicsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMzIubGlzdFsqXS5hZG5sX2FkZHInIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDMzLnV0aW1lX3NpbmNlJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAzMy51dGltZV9zaW5jZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMzMudXRpbWVfdW50aWwnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDMzLnV0aW1lX3VudGlsJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAzMy50b3RhbCcsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMzMudG90YWwnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDMzLnRvdGFsX3dlaWdodCcsIHsgdHlwZTogJ3VpbnQ2NCcsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMzMudG90YWxfd2VpZ2h0JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAzMy5saXN0LnB1YmxpY19rZXknLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDMzLmxpc3RbKl0ucHVibGljX2tleScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMzMubGlzdC53ZWlnaHQnLCB7IHR5cGU6ICd1aW50NjQnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDMzLmxpc3RbKl0ud2VpZ2h0JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAzMy5saXN0LmFkbmxfYWRkcicsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMzMubGlzdFsqXS5hZG5sX2FkZHInIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDM0LnV0aW1lX3NpbmNlJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAzNC51dGltZV9zaW5jZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMzQudXRpbWVfdW50aWwnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDM0LnV0aW1lX3VudGlsJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAzNC50b3RhbCcsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMzQudG90YWwnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDM0LnRvdGFsX3dlaWdodCcsIHsgdHlwZTogJ3VpbnQ2NCcsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMzQudG90YWxfd2VpZ2h0JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAzNC5saXN0LnB1YmxpY19rZXknLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDM0Lmxpc3RbKl0ucHVibGljX2tleScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMzQubGlzdC53ZWlnaHQnLCB7IHR5cGU6ICd1aW50NjQnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDM0Lmxpc3RbKl0ud2VpZ2h0JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAzNC5saXN0LmFkbmxfYWRkcicsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMzQubGlzdFsqXS5hZG5sX2FkZHInIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDM1LnV0aW1lX3NpbmNlJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAzNS51dGltZV9zaW5jZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMzUudXRpbWVfdW50aWwnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDM1LnV0aW1lX3VudGlsJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAzNS50b3RhbCcsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMzUudG90YWwnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDM1LnRvdGFsX3dlaWdodCcsIHsgdHlwZTogJ3VpbnQ2NCcsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMzUudG90YWxfd2VpZ2h0JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAzNS5saXN0LnB1YmxpY19rZXknLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDM1Lmxpc3RbKl0ucHVibGljX2tleScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMzUubGlzdC53ZWlnaHQnLCB7IHR5cGU6ICd1aW50NjQnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDM1Lmxpc3RbKl0ud2VpZ2h0JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAzNS5saXN0LmFkbmxfYWRkcicsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMzUubGlzdFsqXS5hZG5sX2FkZHInIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDM2LnV0aW1lX3NpbmNlJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAzNi51dGltZV9zaW5jZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMzYudXRpbWVfdW50aWwnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDM2LnV0aW1lX3VudGlsJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAzNi50b3RhbCcsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMzYudG90YWwnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDM2LnRvdGFsX3dlaWdodCcsIHsgdHlwZTogJ3VpbnQ2NCcsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMzYudG90YWxfd2VpZ2h0JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAzNi5saXN0LnB1YmxpY19rZXknLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDM2Lmxpc3RbKl0ucHVibGljX2tleScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMzYubGlzdC53ZWlnaHQnLCB7IHR5cGU6ICd1aW50NjQnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDM2Lmxpc3RbKl0ud2VpZ2h0JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAzNi5saXN0LmFkbmxfYWRkcicsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMzYubGlzdFsqXS5hZG5sX2FkZHInIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDM3LnV0aW1lX3NpbmNlJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAzNy51dGltZV9zaW5jZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMzcudXRpbWVfdW50aWwnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDM3LnV0aW1lX3VudGlsJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAzNy50b3RhbCcsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMzcudG90YWwnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDM3LnRvdGFsX3dlaWdodCcsIHsgdHlwZTogJ3VpbnQ2NCcsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMzcudG90YWxfd2VpZ2h0JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAzNy5saXN0LnB1YmxpY19rZXknLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDM3Lmxpc3RbKl0ucHVibGljX2tleScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMzcubGlzdC53ZWlnaHQnLCB7IHR5cGU6ICd1aW50NjQnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDM3Lmxpc3RbKl0ud2VpZ2h0JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAzNy5saXN0LmFkbmxfYWRkcicsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMzcubGlzdFsqXS5hZG5sX2FkZHInIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDM5LmFkbmxfYWRkcicsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMzlbKl0uYWRubF9hZGRyJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAzOS50ZW1wX3B1YmxpY19rZXknLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDM5WypdLnRlbXBfcHVibGljX2tleScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMzkuc2Vxbm8nLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDM5WypdLnNlcW5vJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAzOS52YWxpZF91bnRpbCcsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMzlbKl0udmFsaWRfdW50aWwnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDM5LnNpZ25hdHVyZV9yJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAzOVsqXS5zaWduYXR1cmVfcicgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMzkuc2lnbmF0dXJlX3MnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDM5WypdLnNpZ25hdHVyZV9zJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5rZXlfYmxvY2snLCB7IHR5cGU6ICdib29sZWFuJywgcGF0aDogJ2RvYy5rZXlfYmxvY2snIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLmJvYycsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MuYm9jJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ3RyYW5zYWN0aW9ucy5pZCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MuX2tleScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCd0cmFuc2FjdGlvbnMuYmxvY2tfaWQnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLmJsb2NrX2lkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ3RyYW5zYWN0aW9ucy5hY2NvdW50X2FkZHInLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLmFjY291bnRfYWRkcicgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCd0cmFuc2FjdGlvbnMud29ya2NoYWluX2lkJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy53b3JrY2hhaW5faWQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgndHJhbnNhY3Rpb25zLmx0JywgeyB0eXBlOiAndWludDY0JywgcGF0aDogJ2RvYy5sdCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCd0cmFuc2FjdGlvbnMucHJldl90cmFuc19oYXNoJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5wcmV2X3RyYW5zX2hhc2gnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgndHJhbnNhY3Rpb25zLnByZXZfdHJhbnNfbHQnLCB7IHR5cGU6ICd1aW50NjQnLCBwYXRoOiAnZG9jLnByZXZfdHJhbnNfbHQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgndHJhbnNhY3Rpb25zLm5vdycsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2Mubm93JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ3RyYW5zYWN0aW9ucy5vdXRtc2dfY250JywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5vdXRtc2dfY250JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ3RyYW5zYWN0aW9ucy5pbl9tc2cnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLmluX21zZycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCd0cmFuc2FjdGlvbnMub3V0X21zZ3MnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm91dF9tc2dzWypdJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ3RyYW5zYWN0aW9ucy50b3RhbF9mZWVzJywgeyB0eXBlOiAndWludDEwMjQnLCBwYXRoOiAnZG9jLnRvdGFsX2ZlZXMnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgndHJhbnNhY3Rpb25zLnRvdGFsX2ZlZXNfb3RoZXIuY3VycmVuY3knLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLnRvdGFsX2ZlZXNfb3RoZXJbKl0uY3VycmVuY3knIH0pO1xuc2NhbGFyRmllbGRzLnNldCgndHJhbnNhY3Rpb25zLnRvdGFsX2ZlZXNfb3RoZXIudmFsdWUnLCB7IHR5cGU6ICd1aW50MTAyNCcsIHBhdGg6ICdkb2MudG90YWxfZmVlc19vdGhlclsqXS52YWx1ZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCd0cmFuc2FjdGlvbnMub2xkX2hhc2gnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm9sZF9oYXNoJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ3RyYW5zYWN0aW9ucy5uZXdfaGFzaCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MubmV3X2hhc2gnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgndHJhbnNhY3Rpb25zLmNyZWRpdF9maXJzdCcsIHsgdHlwZTogJ2Jvb2xlYW4nLCBwYXRoOiAnZG9jLmNyZWRpdF9maXJzdCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCd0cmFuc2FjdGlvbnMuc3RvcmFnZS5zdG9yYWdlX2ZlZXNfY29sbGVjdGVkJywgeyB0eXBlOiAndWludDEwMjQnLCBwYXRoOiAnZG9jLnN0b3JhZ2Uuc3RvcmFnZV9mZWVzX2NvbGxlY3RlZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCd0cmFuc2FjdGlvbnMuc3RvcmFnZS5zdG9yYWdlX2ZlZXNfZHVlJywgeyB0eXBlOiAndWludDEwMjQnLCBwYXRoOiAnZG9jLnN0b3JhZ2Uuc3RvcmFnZV9mZWVzX2R1ZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCd0cmFuc2FjdGlvbnMuY3JlZGl0LmR1ZV9mZWVzX2NvbGxlY3RlZCcsIHsgdHlwZTogJ3VpbnQxMDI0JywgcGF0aDogJ2RvYy5jcmVkaXQuZHVlX2ZlZXNfY29sbGVjdGVkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ3RyYW5zYWN0aW9ucy5jcmVkaXQuY3JlZGl0JywgeyB0eXBlOiAndWludDEwMjQnLCBwYXRoOiAnZG9jLmNyZWRpdC5jcmVkaXQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgndHJhbnNhY3Rpb25zLmNyZWRpdC5jcmVkaXRfb3RoZXIuY3VycmVuY3knLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLmNyZWRpdC5jcmVkaXRfb3RoZXJbKl0uY3VycmVuY3knIH0pO1xuc2NhbGFyRmllbGRzLnNldCgndHJhbnNhY3Rpb25zLmNyZWRpdC5jcmVkaXRfb3RoZXIudmFsdWUnLCB7IHR5cGU6ICd1aW50MTAyNCcsIHBhdGg6ICdkb2MuY3JlZGl0LmNyZWRpdF9vdGhlclsqXS52YWx1ZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCd0cmFuc2FjdGlvbnMuY29tcHV0ZS5zdWNjZXNzJywgeyB0eXBlOiAnYm9vbGVhbicsIHBhdGg6ICdkb2MuY29tcHV0ZS5zdWNjZXNzJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ3RyYW5zYWN0aW9ucy5jb21wdXRlLm1zZ19zdGF0ZV91c2VkJywgeyB0eXBlOiAnYm9vbGVhbicsIHBhdGg6ICdkb2MuY29tcHV0ZS5tc2dfc3RhdGVfdXNlZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCd0cmFuc2FjdGlvbnMuY29tcHV0ZS5hY2NvdW50X2FjdGl2YXRlZCcsIHsgdHlwZTogJ2Jvb2xlYW4nLCBwYXRoOiAnZG9jLmNvbXB1dGUuYWNjb3VudF9hY3RpdmF0ZWQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgndHJhbnNhY3Rpb25zLmNvbXB1dGUuZ2FzX2ZlZXMnLCB7IHR5cGU6ICd1aW50MTAyNCcsIHBhdGg6ICdkb2MuY29tcHV0ZS5nYXNfZmVlcycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCd0cmFuc2FjdGlvbnMuY29tcHV0ZS5nYXNfdXNlZCcsIHsgdHlwZTogJ3VpbnQ2NCcsIHBhdGg6ICdkb2MuY29tcHV0ZS5nYXNfdXNlZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCd0cmFuc2FjdGlvbnMuY29tcHV0ZS5nYXNfbGltaXQnLCB7IHR5cGU6ICd1aW50NjQnLCBwYXRoOiAnZG9jLmNvbXB1dGUuZ2FzX2xpbWl0JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ3RyYW5zYWN0aW9ucy5jb21wdXRlLmdhc19jcmVkaXQnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLmNvbXB1dGUuZ2FzX2NyZWRpdCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCd0cmFuc2FjdGlvbnMuY29tcHV0ZS5tb2RlJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5jb21wdXRlLm1vZGUnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgndHJhbnNhY3Rpb25zLmNvbXB1dGUuZXhpdF9jb2RlJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5jb21wdXRlLmV4aXRfY29kZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCd0cmFuc2FjdGlvbnMuY29tcHV0ZS5leGl0X2FyZycsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MuY29tcHV0ZS5leGl0X2FyZycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCd0cmFuc2FjdGlvbnMuY29tcHV0ZS52bV9zdGVwcycsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MuY29tcHV0ZS52bV9zdGVwcycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCd0cmFuc2FjdGlvbnMuY29tcHV0ZS52bV9pbml0X3N0YXRlX2hhc2gnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLmNvbXB1dGUudm1faW5pdF9zdGF0ZV9oYXNoJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ3RyYW5zYWN0aW9ucy5jb21wdXRlLnZtX2ZpbmFsX3N0YXRlX2hhc2gnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLmNvbXB1dGUudm1fZmluYWxfc3RhdGVfaGFzaCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCd0cmFuc2FjdGlvbnMuYWN0aW9uLnN1Y2Nlc3MnLCB7IHR5cGU6ICdib29sZWFuJywgcGF0aDogJ2RvYy5hY3Rpb24uc3VjY2VzcycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCd0cmFuc2FjdGlvbnMuYWN0aW9uLnZhbGlkJywgeyB0eXBlOiAnYm9vbGVhbicsIHBhdGg6ICdkb2MuYWN0aW9uLnZhbGlkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ3RyYW5zYWN0aW9ucy5hY3Rpb24ubm9fZnVuZHMnLCB7IHR5cGU6ICdib29sZWFuJywgcGF0aDogJ2RvYy5hY3Rpb24ubm9fZnVuZHMnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgndHJhbnNhY3Rpb25zLmFjdGlvbi50b3RhbF9md2RfZmVlcycsIHsgdHlwZTogJ3VpbnQxMDI0JywgcGF0aDogJ2RvYy5hY3Rpb24udG90YWxfZndkX2ZlZXMnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgndHJhbnNhY3Rpb25zLmFjdGlvbi50b3RhbF9hY3Rpb25fZmVlcycsIHsgdHlwZTogJ3VpbnQxMDI0JywgcGF0aDogJ2RvYy5hY3Rpb24udG90YWxfYWN0aW9uX2ZlZXMnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgndHJhbnNhY3Rpb25zLmFjdGlvbi5yZXN1bHRfY29kZScsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MuYWN0aW9uLnJlc3VsdF9jb2RlJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ3RyYW5zYWN0aW9ucy5hY3Rpb24ucmVzdWx0X2FyZycsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MuYWN0aW9uLnJlc3VsdF9hcmcnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgndHJhbnNhY3Rpb25zLmFjdGlvbi50b3RfYWN0aW9ucycsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MuYWN0aW9uLnRvdF9hY3Rpb25zJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ3RyYW5zYWN0aW9ucy5hY3Rpb24uc3BlY19hY3Rpb25zJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5hY3Rpb24uc3BlY19hY3Rpb25zJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ3RyYW5zYWN0aW9ucy5hY3Rpb24uc2tpcHBlZF9hY3Rpb25zJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5hY3Rpb24uc2tpcHBlZF9hY3Rpb25zJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ3RyYW5zYWN0aW9ucy5hY3Rpb24ubXNnc19jcmVhdGVkJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5hY3Rpb24ubXNnc19jcmVhdGVkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ3RyYW5zYWN0aW9ucy5hY3Rpb24uYWN0aW9uX2xpc3RfaGFzaCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MuYWN0aW9uLmFjdGlvbl9saXN0X2hhc2gnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgndHJhbnNhY3Rpb25zLmFjdGlvbi50b3RhbF9tc2dfc2l6ZV9jZWxscycsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MuYWN0aW9uLnRvdGFsX21zZ19zaXplX2NlbGxzJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ3RyYW5zYWN0aW9ucy5hY3Rpb24udG90YWxfbXNnX3NpemVfYml0cycsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MuYWN0aW9uLnRvdGFsX21zZ19zaXplX2JpdHMnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgndHJhbnNhY3Rpb25zLmJvdW5jZS5tc2dfc2l6ZV9jZWxscycsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MuYm91bmNlLm1zZ19zaXplX2NlbGxzJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ3RyYW5zYWN0aW9ucy5ib3VuY2UubXNnX3NpemVfYml0cycsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MuYm91bmNlLm1zZ19zaXplX2JpdHMnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgndHJhbnNhY3Rpb25zLmJvdW5jZS5yZXFfZndkX2ZlZXMnLCB7IHR5cGU6ICd1aW50MTAyNCcsIHBhdGg6ICdkb2MuYm91bmNlLnJlcV9md2RfZmVlcycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCd0cmFuc2FjdGlvbnMuYm91bmNlLm1zZ19mZWVzJywgeyB0eXBlOiAndWludDEwMjQnLCBwYXRoOiAnZG9jLmJvdW5jZS5tc2dfZmVlcycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCd0cmFuc2FjdGlvbnMuYm91bmNlLmZ3ZF9mZWVzJywgeyB0eXBlOiAndWludDEwMjQnLCBwYXRoOiAnZG9jLmJvdW5jZS5md2RfZmVlcycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCd0cmFuc2FjdGlvbnMuYWJvcnRlZCcsIHsgdHlwZTogJ2Jvb2xlYW4nLCBwYXRoOiAnZG9jLmFib3J0ZWQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgndHJhbnNhY3Rpb25zLmRlc3Ryb3llZCcsIHsgdHlwZTogJ2Jvb2xlYW4nLCBwYXRoOiAnZG9jLmRlc3Ryb3llZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCd0cmFuc2FjdGlvbnMudHQnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLnR0JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ3RyYW5zYWN0aW9ucy5zcGxpdF9pbmZvLmN1cl9zaGFyZF9wZnhfbGVuJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5zcGxpdF9pbmZvLmN1cl9zaGFyZF9wZnhfbGVuJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ3RyYW5zYWN0aW9ucy5zcGxpdF9pbmZvLmFjY19zcGxpdF9kZXB0aCcsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2Muc3BsaXRfaW5mby5hY2Nfc3BsaXRfZGVwdGgnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgndHJhbnNhY3Rpb25zLnNwbGl0X2luZm8udGhpc19hZGRyJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5zcGxpdF9pbmZvLnRoaXNfYWRkcicgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCd0cmFuc2FjdGlvbnMuc3BsaXRfaW5mby5zaWJsaW5nX2FkZHInLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLnNwbGl0X2luZm8uc2libGluZ19hZGRyJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ3RyYW5zYWN0aW9ucy5wcmVwYXJlX3RyYW5zYWN0aW9uJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5wcmVwYXJlX3RyYW5zYWN0aW9uJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ3RyYW5zYWN0aW9ucy5pbnN0YWxsZWQnLCB7IHR5cGU6ICdib29sZWFuJywgcGF0aDogJ2RvYy5pbnN0YWxsZWQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgndHJhbnNhY3Rpb25zLnByb29mJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5wcm9vZicgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCd0cmFuc2FjdGlvbnMuYm9jJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5ib2MnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnbWVzc2FnZXMuaWQnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLl9rZXknIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnbWVzc2FnZXMuYmxvY2tfaWQnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLmJsb2NrX2lkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ21lc3NhZ2VzLmJvZHknLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLmJvZHknIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnbWVzc2FnZXMuYm9keV9oYXNoJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5ib2R5X2hhc2gnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnbWVzc2FnZXMuc3BsaXRfZGVwdGgnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLnNwbGl0X2RlcHRoJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ21lc3NhZ2VzLnRpY2snLCB7IHR5cGU6ICdib29sZWFuJywgcGF0aDogJ2RvYy50aWNrJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ21lc3NhZ2VzLnRvY2snLCB7IHR5cGU6ICdib29sZWFuJywgcGF0aDogJ2RvYy50b2NrJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ21lc3NhZ2VzLmNvZGUnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLmNvZGUnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnbWVzc2FnZXMuY29kZV9oYXNoJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5jb2RlX2hhc2gnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnbWVzc2FnZXMuZGF0YScsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MuZGF0YScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdtZXNzYWdlcy5kYXRhX2hhc2gnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLmRhdGFfaGFzaCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdtZXNzYWdlcy5saWJyYXJ5JywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5saWJyYXJ5JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ21lc3NhZ2VzLmxpYnJhcnlfaGFzaCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MubGlicmFyeV9oYXNoJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ21lc3NhZ2VzLnNyYycsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2Muc3JjJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ21lc3NhZ2VzLmRzdCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MuZHN0JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ21lc3NhZ2VzLnNyY193b3JrY2hhaW5faWQnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLnNyY193b3JrY2hhaW5faWQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnbWVzc2FnZXMuZHN0X3dvcmtjaGFpbl9pZCcsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MuZHN0X3dvcmtjaGFpbl9pZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdtZXNzYWdlcy5jcmVhdGVkX2x0JywgeyB0eXBlOiAndWludDY0JywgcGF0aDogJ2RvYy5jcmVhdGVkX2x0JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ21lc3NhZ2VzLmNyZWF0ZWRfYXQnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLmNyZWF0ZWRfYXQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnbWVzc2FnZXMuaWhyX2Rpc2FibGVkJywgeyB0eXBlOiAnYm9vbGVhbicsIHBhdGg6ICdkb2MuaWhyX2Rpc2FibGVkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ21lc3NhZ2VzLmlocl9mZWUnLCB7IHR5cGU6ICd1aW50MTAyNCcsIHBhdGg6ICdkb2MuaWhyX2ZlZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdtZXNzYWdlcy5md2RfZmVlJywgeyB0eXBlOiAndWludDEwMjQnLCBwYXRoOiAnZG9jLmZ3ZF9mZWUnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnbWVzc2FnZXMuaW1wb3J0X2ZlZScsIHsgdHlwZTogJ3VpbnQxMDI0JywgcGF0aDogJ2RvYy5pbXBvcnRfZmVlJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ21lc3NhZ2VzLmJvdW5jZScsIHsgdHlwZTogJ2Jvb2xlYW4nLCBwYXRoOiAnZG9jLmJvdW5jZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdtZXNzYWdlcy5ib3VuY2VkJywgeyB0eXBlOiAnYm9vbGVhbicsIHBhdGg6ICdkb2MuYm91bmNlZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdtZXNzYWdlcy52YWx1ZScsIHsgdHlwZTogJ3VpbnQxMDI0JywgcGF0aDogJ2RvYy52YWx1ZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdtZXNzYWdlcy52YWx1ZV9vdGhlci5jdXJyZW5jeScsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MudmFsdWVfb3RoZXJbKl0uY3VycmVuY3knIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnbWVzc2FnZXMudmFsdWVfb3RoZXIudmFsdWUnLCB7IHR5cGU6ICd1aW50MTAyNCcsIHBhdGg6ICdkb2MudmFsdWVfb3RoZXJbKl0udmFsdWUnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnbWVzc2FnZXMucHJvb2YnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLnByb29mJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ21lc3NhZ2VzLmJvYycsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MuYm9jJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2FjY291bnRzLmlkJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5fa2V5JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2FjY291bnRzLndvcmtjaGFpbl9pZCcsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2Mud29ya2NoYWluX2lkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2FjY291bnRzLmxhc3RfcGFpZCcsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubGFzdF9wYWlkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2FjY291bnRzLmR1ZV9wYXltZW50JywgeyB0eXBlOiAndWludDEwMjQnLCBwYXRoOiAnZG9jLmR1ZV9wYXltZW50JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2FjY291bnRzLmxhc3RfdHJhbnNfbHQnLCB7IHR5cGU6ICd1aW50NjQnLCBwYXRoOiAnZG9jLmxhc3RfdHJhbnNfbHQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYWNjb3VudHMuYmFsYW5jZScsIHsgdHlwZTogJ3VpbnQxMDI0JywgcGF0aDogJ2RvYy5iYWxhbmNlJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2FjY291bnRzLmJhbGFuY2Vfb3RoZXIuY3VycmVuY3knLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLmJhbGFuY2Vfb3RoZXJbKl0uY3VycmVuY3knIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYWNjb3VudHMuYmFsYW5jZV9vdGhlci52YWx1ZScsIHsgdHlwZTogJ3VpbnQxMDI0JywgcGF0aDogJ2RvYy5iYWxhbmNlX290aGVyWypdLnZhbHVlJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2FjY291bnRzLnNwbGl0X2RlcHRoJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5zcGxpdF9kZXB0aCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdhY2NvdW50cy50aWNrJywgeyB0eXBlOiAnYm9vbGVhbicsIHBhdGg6ICdkb2MudGljaycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdhY2NvdW50cy50b2NrJywgeyB0eXBlOiAnYm9vbGVhbicsIHBhdGg6ICdkb2MudG9jaycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdhY2NvdW50cy5jb2RlJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5jb2RlJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2FjY291bnRzLmNvZGVfaGFzaCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MuY29kZV9oYXNoJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2FjY291bnRzLmRhdGEnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLmRhdGEnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYWNjb3VudHMuZGF0YV9oYXNoJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5kYXRhX2hhc2gnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYWNjb3VudHMubGlicmFyeScsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MubGlicmFyeScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdhY2NvdW50cy5saWJyYXJ5X2hhc2gnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLmxpYnJhcnlfaGFzaCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdhY2NvdW50cy5wcm9vZicsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MucHJvb2YnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYWNjb3VudHMuYm9jJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5ib2MnIH0pO1xubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgc2NhbGFyRmllbGRzLFxuICAgIGNyZWF0ZVJlc29sdmVycyxcbiAgICBPdGhlckN1cnJlbmN5LFxuICAgIEV4dEJsa1JlZixcbiAgICBNc2dFbnZlbG9wZSxcbiAgICBJbk1zZyxcbiAgICBPdXRNc2csXG4gICAgQmxvY2tWYWx1ZUZsb3csXG4gICAgQmxvY2tBY2NvdW50QmxvY2tzVHJhbnNhY3Rpb25zLFxuICAgIEJsb2NrQWNjb3VudEJsb2NrcyxcbiAgICBCbG9ja1N0YXRlVXBkYXRlLFxuICAgIEJsb2NrTWFzdGVyU2hhcmRIYXNoZXNEZXNjcixcbiAgICBCbG9ja01hc3RlclNoYXJkSGFzaGVzLFxuICAgIEJsb2NrTWFzdGVyU2hhcmRGZWVzLFxuICAgIEJsb2NrTWFzdGVyUHJldkJsa1NpZ25hdHVyZXMsXG4gICAgQmxvY2tNYXN0ZXJDb25maWdQNixcbiAgICBCbG9ja01hc3RlckNvbmZpZ1A3LFxuICAgIEJsb2NrTWFzdGVyQ29uZmlnUDgsXG4gICAgQ29uZmlnUHJvcG9zYWxTZXR1cCxcbiAgICBCbG9ja01hc3RlckNvbmZpZ1AxMSxcbiAgICBCbG9ja01hc3RlckNvbmZpZ1AxMixcbiAgICBCbG9ja01hc3RlckNvbmZpZ1AxNCxcbiAgICBCbG9ja01hc3RlckNvbmZpZ1AxNSxcbiAgICBCbG9ja01hc3RlckNvbmZpZ1AxNixcbiAgICBCbG9ja01hc3RlckNvbmZpZ1AxNyxcbiAgICBCbG9ja01hc3RlckNvbmZpZ1AxOCxcbiAgICBHYXNMaW1pdHNQcmljZXMsXG4gICAgQmxvY2tMaW1pdHNCeXRlcyxcbiAgICBCbG9ja0xpbWl0c0dhcyxcbiAgICBCbG9ja0xpbWl0c0x0RGVsdGEsXG4gICAgQmxvY2tMaW1pdHMsXG4gICAgTXNnRm9yd2FyZFByaWNlcyxcbiAgICBCbG9ja01hc3RlckNvbmZpZ1AyOCxcbiAgICBCbG9ja01hc3RlckNvbmZpZ1AyOSxcbiAgICBWYWxpZGF0b3JTZXRMaXN0LFxuICAgIFZhbGlkYXRvclNldCxcbiAgICBCbG9ja01hc3RlckNvbmZpZ1AzOSxcbiAgICBCbG9ja01hc3RlckNvbmZpZyxcbiAgICBCbG9ja01hc3RlcixcbiAgICBCbG9ja1NpZ25hdHVyZXNTaWduYXR1cmVzLFxuICAgIEJsb2NrU2lnbmF0dXJlcyxcbiAgICBCbG9jayxcbiAgICBUcmFuc2FjdGlvblN0b3JhZ2UsXG4gICAgVHJhbnNhY3Rpb25DcmVkaXQsXG4gICAgVHJhbnNhY3Rpb25Db21wdXRlLFxuICAgIFRyYW5zYWN0aW9uQWN0aW9uLFxuICAgIFRyYW5zYWN0aW9uQm91bmNlLFxuICAgIFRyYW5zYWN0aW9uU3BsaXRJbmZvLFxuICAgIFRyYW5zYWN0aW9uLFxuICAgIE1lc3NhZ2UsXG4gICAgQWNjb3VudCxcbn07XG4iXX0=