"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _schema = require("ton-labs-dev-ops/dist/src/schema");

var _dbSchemaTypes = require("./db-schema-types");

var _dbShema = require("./db.shema.docs");

/*
 * Copyright 2018-2020 TON DEV SOLUTIONS LTD.
 *
 * Licensed under the SOFTWARE EVALUATION License (the "License"); you may not use
 * this file except in compliance with the License.  You may obtain a copy of the
 * License at:
 *
 * http://www.ton.dev/licenses
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific TON DEV software governing permissions and
 * limitations under the License.
 */
const {
  string,
  bool,
  ref,
  arrayOf
} = _schema.Def;
const accountStatus = (0, _dbSchemaTypes.u8enum)('AccountStatus', {
  uninit: 0,
  active: 1,
  frozen: 2,
  nonExist: 3
});
const accountStatusChange = (0, _dbSchemaTypes.u8enum)('AccountStatusChange', {
  unchanged: 0,
  frozen: 1,
  deleted: 2
});
const skipReason = (0, _dbSchemaTypes.u8enum)('SkipReason', {
  noState: 0,
  badState: 1,
  noGas: 2
});
const accountType = (0, _dbSchemaTypes.u8enum)('AccountType', {
  uninit: 0,
  active: 1,
  frozen: 2
});
const messageType = (0, _dbSchemaTypes.u8enum)('MessageType', {
  internal: 0,
  extIn: 1,
  extOut: 2
});
const messageProcessingStatus = (0, _dbSchemaTypes.u8enum)('MessageProcessingStatus', {
  unknown: 0,
  queued: 1,
  processing: 2,
  preliminary: 3,
  proposed: 4,
  finalized: 5,
  refused: 6,
  transiting: 7
});
const transactionType = (0, _dbSchemaTypes.u8enum)('TransactionType', {
  ordinary: 0,
  storage: 1,
  tick: 2,
  tock: 3,
  splitPrepare: 4,
  splitInstall: 5,
  mergePrepare: 6,
  mergeInstall: 7
});
const transactionProcessingStatus = (0, _dbSchemaTypes.u8enum)('TransactionProcessingStatus', {
  unknown: 0,
  preliminary: 1,
  proposed: 2,
  finalized: 3,
  refused: 4
});
const computeType = (0, _dbSchemaTypes.u8enum)('ComputeType', {
  skipped: 0,
  vm: 1
});
const bounceType = (0, _dbSchemaTypes.u8enum)('BounceType', {
  negFunds: 0,
  noFunds: 1,
  ok: 2
});
const blockProcessingStatus = (0, _dbSchemaTypes.u8enum)('BlockProcessingStatus', {
  unknown: 0,
  proposed: 1,
  finalized: 2,
  refused: 3
});
const inMsgType = (0, _dbSchemaTypes.u8enum)('InMsgType', {
  external: 0,
  ihr: 1,
  immediately: 2,
  final: 3,
  transit: 4,
  discardedFinal: 5,
  discardedTransit: 6
});
const outMsgType = (0, _dbSchemaTypes.u8enum)('OutMsgType', {
  external: 0,
  immediately: 1,
  outMsgNew: 2,
  transit: 3,
  dequeueImmediately: 4,
  dequeue: 5,
  transitRequired: 6,
  dequeueShort: 7,
  none: -1
});
const splitType = (0, _dbSchemaTypes.u8enum)('SplitType', {
  none: 0,
  split: 2,
  merge: 3
});
const Account = {
  _doc: _dbShema.docs.account._doc,
  _: {
    collection: 'accounts'
  },
  workchain_id: (0, _dbSchemaTypes.i32)(_dbShema.docs.account.workchain_id),
  acc_type: (0, _dbSchemaTypes.required)(accountType(_dbShema.docs.account.acc_type)),
  last_paid: (0, _dbSchemaTypes.required)((0, _dbSchemaTypes.u32)(_dbShema.docs.account.last_paid)),
  due_payment: (0, _dbSchemaTypes.grams)(_dbShema.docs.account.due_payment),
  last_trans_lt: (0, _dbSchemaTypes.required)((0, _dbSchemaTypes.u64)(_dbShema.docs.account.last_trans_lt)),
  // index
  balance: (0, _dbSchemaTypes.required)((0, _dbSchemaTypes.grams)(_dbShema.docs.account.balance)),
  // index
  balance_other: (0, _dbSchemaTypes.otherCurrencyCollection)(_dbShema.docs.account.balance_other),
  split_depth: (0, _dbSchemaTypes.u8)(_dbShema.docs.account.split_depth),
  tick: bool(_dbShema.docs.account.tick),
  tock: bool(_dbShema.docs.account.tock),
  code: string(_dbShema.docs.account.code),
  code_hash: string(_dbShema.docs.account.code_hash),
  data: string(_dbShema.docs.account.data),
  data_hash: string(_dbShema.docs.account.data_hash),
  library: string(_dbShema.docs.account.library),
  library_hash: string(_dbShema.docs.account.library_hash),
  proof: string(_dbShema.docs.account.proof),
  boc: string(_dbShema.docs.account.boc)
};
const Message = {
  _doc: _dbShema.docs.message._doc,
  _: {
    collection: 'messages'
  },
  msg_type: (0, _dbSchemaTypes.required)(messageType(_dbShema.docs.message.msg_type)),
  status: (0, _dbSchemaTypes.required)(messageProcessingStatus(_dbShema.docs.message.status)),
  block_id: (0, _dbSchemaTypes.required)(string(_dbShema.docs.message.block_id)),
  block: (0, _dbSchemaTypes.join)('Block', 'block_id', 'id'),
  body: string(_dbShema.docs.message.body),
  body_hash: string(_dbShema.docs.message.body_hash),
  split_depth: (0, _dbSchemaTypes.u8)(_dbShema.docs.message.split_depth),
  tick: bool(_dbShema.docs.message.tick),
  tock: bool(_dbShema.docs.message.tock),
  code: string(_dbShema.docs.message.code),
  code_hash: string(_dbShema.docs.message.code_hash),
  data: string(_dbShema.docs.message.data),
  data_hash: string(_dbShema.docs.message.data_hash),
  library: string(_dbShema.docs.message.library),
  library_hash: string(_dbShema.docs.message.library_hash),
  src: string(_dbShema.docs.message.src),
  dst: string(_dbShema.docs.message.dst),
  src_workchain_id: (0, _dbSchemaTypes.i32)(_dbShema.docs.message.src_workchain_id),
  dst_workchain_id: (0, _dbSchemaTypes.i32)(_dbShema.docs.message.dst_workchain_id),
  created_lt: (0, _dbSchemaTypes.u64)(_dbShema.docs.message.created_lt),
  created_at: (0, _dbSchemaTypes.unixTime)(_dbShema.docs.message.created_at),
  ihr_disabled: bool(_dbShema.docs.message.ihr_disabled),
  ihr_fee: (0, _dbSchemaTypes.grams)(_dbShema.docs.message.ihr_fee),
  fwd_fee: (0, _dbSchemaTypes.grams)(_dbShema.docs.message.fwd_fee),
  import_fee: (0, _dbSchemaTypes.grams)(_dbShema.docs.message.import_fee),
  bounce: bool(_dbShema.docs.message.bounce),
  bounced: bool(_dbShema.docs.message.bounced),
  value: (0, _dbSchemaTypes.grams)(_dbShema.docs.message.value),
  value_other: (0, _dbSchemaTypes.otherCurrencyCollection)(_dbShema.docs.message.value_other),
  proof: string(_dbShema.docs.message.proof),
  boc: string(_dbShema.docs.message.boc),
  src_transaction: (0, _dbSchemaTypes.join)('Transaction', 'id', 'out_msgs[*]', 'parent.created_lt !== \'00\' && parent.msg_type !== 1'),
  dst_transaction: (0, _dbSchemaTypes.join)('Transaction', 'id', 'in_msg', 'parent.msg_type !== 2')
};
const Transaction = {
  _doc: _dbShema.docs.transaction._doc,
  _: {
    collection: 'transactions'
  },
  tr_type: (0, _dbSchemaTypes.required)(transactionType(_dbShema.docs.transaction.tr_type)),
  status: (0, _dbSchemaTypes.required)(transactionProcessingStatus(_dbShema.docs.transaction.status)),
  block_id: string(_dbShema.docs.transaction.block_id),
  block: (0, _dbSchemaTypes.join)('Block', 'block_id', 'id'),
  account_addr: string(_dbShema.docs.transaction.account_addr),
  workchain_id: (0, _dbSchemaTypes.i32)(_dbShema.docs.transaction.workchain_id),
  lt: (0, _dbSchemaTypes.u64)(_dbShema.docs.transaction.lt),
  prev_trans_hash: string(_dbShema.docs.transaction.prev_trans_hash),
  prev_trans_lt: (0, _dbSchemaTypes.u64)(_dbShema.docs.transaction.prev_trans_lt),
  now: (0, _dbSchemaTypes.u32)(_dbShema.docs.transaction.now),
  outmsg_cnt: (0, _dbSchemaTypes.i32)(_dbShema.docs.transaction.outmsg_cnt),
  orig_status: accountStatus(_dbShema.docs.transaction.orig_status),
  end_status: accountStatus(_dbShema.docs.transaction.end_status),
  in_msg: string(_dbShema.docs.transaction.in_msg),
  in_message: (0, _dbSchemaTypes.join)({
    Message
  }, 'in_msg', 'id'),
  out_msgs: arrayOf(string(_dbShema.docs.transaction.out_msgs)),
  out_messages: arrayOf((0, _dbSchemaTypes.join)({
    Message
  }, 'out_msgs', 'id')),
  total_fees: (0, _dbSchemaTypes.grams)(_dbShema.docs.transaction.total_fees),
  total_fees_other: (0, _dbSchemaTypes.otherCurrencyCollection)(_dbShema.docs.transaction.total_fees_other),
  old_hash: string(_dbShema.docs.transaction.old_hash),
  new_hash: string(_dbShema.docs.transaction.new_hash),
  credit_first: bool(_dbShema.docs.transaction.credit_first),
  storage: {
    storage_fees_collected: (0, _dbSchemaTypes.grams)(_dbShema.docs.transaction.storage.storage_fees_collected),
    storage_fees_due: (0, _dbSchemaTypes.grams)(_dbShema.docs.transaction.storage.storage_fees_due),
    status_change: accountStatusChange(_dbShema.docs.transaction.storage.status_change)
  },
  credit: {
    due_fees_collected: (0, _dbSchemaTypes.grams)(_dbShema.docs.transaction.credit.due_fees_collected),
    credit: (0, _dbSchemaTypes.grams)(_dbShema.docs.transaction.credit.credit),
    credit_other: (0, _dbSchemaTypes.otherCurrencyCollection)(_dbShema.docs.transaction.credit.credit_other)
  },
  compute: {
    compute_type: (0, _dbSchemaTypes.required)(computeType(_dbShema.docs.transaction.compute.compute_type)),
    skipped_reason: skipReason(_dbShema.docs.transaction.compute.skipped_reason),
    success: bool(_dbShema.docs.transaction.compute.success),
    msg_state_used: bool(_dbShema.docs.transaction.compute.msg_state_used),
    account_activated: bool(_dbShema.docs.transaction.compute.account_activated),
    gas_fees: (0, _dbSchemaTypes.grams)(_dbShema.docs.transaction.compute.gas_fees),
    gas_used: (0, _dbSchemaTypes.u64)(_dbShema.docs.transaction.compute.gas_used),
    gas_limit: (0, _dbSchemaTypes.u64)(_dbShema.docs.transaction.compute.gas_limit),
    gas_credit: (0, _dbSchemaTypes.i32)(_dbShema.docs.transaction.compute.gas_credit),
    mode: (0, _dbSchemaTypes.i8)(_dbShema.docs.transaction.compute.mode),
    exit_code: (0, _dbSchemaTypes.i32)(_dbShema.docs.transaction.compute.exit_code),
    exit_arg: (0, _dbSchemaTypes.i32)(_dbShema.docs.transaction.compute.exit_arg),
    vm_steps: (0, _dbSchemaTypes.u32)(_dbShema.docs.transaction.compute.vm_steps),
    vm_init_state_hash: string(_dbShema.docs.transaction.compute.vm_init_state_hash),
    vm_final_state_hash: string(_dbShema.docs.transaction.compute.vm_final_state_hash)
  },
  action: {
    success: bool(_dbShema.docs.transaction.action.success),
    valid: bool(_dbShema.docs.transaction.action.valid),
    no_funds: bool(_dbShema.docs.transaction.action.no_funds),
    status_change: accountStatusChange(_dbShema.docs.transaction.action.status_change),
    total_fwd_fees: (0, _dbSchemaTypes.grams)(_dbShema.docs.transaction.action.total_fwd_fees),
    total_action_fees: (0, _dbSchemaTypes.grams)(_dbShema.docs.transaction.action.total_action_fees),
    result_code: (0, _dbSchemaTypes.i32)(_dbShema.docs.transaction.action.result_code),
    result_arg: (0, _dbSchemaTypes.i32)(_dbShema.docs.transaction.action.result_arg),
    tot_actions: (0, _dbSchemaTypes.i32)(_dbShema.docs.transaction.action.tot_actions),
    spec_actions: (0, _dbSchemaTypes.i32)(_dbShema.docs.transaction.action.spec_actions),
    skipped_actions: (0, _dbSchemaTypes.i32)(_dbShema.docs.transaction.action.skipped_actions),
    msgs_created: (0, _dbSchemaTypes.i32)(_dbShema.docs.transaction.action.msgs_created),
    action_list_hash: string(_dbShema.docs.transaction.action.action_list_hash),
    total_msg_size_cells: (0, _dbSchemaTypes.u32)(_dbShema.docs.transaction.action.total_msg_size_cells),
    total_msg_size_bits: (0, _dbSchemaTypes.u32)(_dbShema.docs.transaction.action.total_msg_size_bits)
  },
  bounce: {
    bounce_type: (0, _dbSchemaTypes.required)(bounceType(_dbShema.docs.transaction.bounce.bounce_type)),
    msg_size_cells: (0, _dbSchemaTypes.u32)(_dbShema.docs.transaction.bounce.msg_size_cells),
    msg_size_bits: (0, _dbSchemaTypes.u32)(_dbShema.docs.transaction.bounce.msg_size_bits),
    req_fwd_fees: (0, _dbSchemaTypes.grams)(_dbShema.docs.transaction.bounce.req_fwd_fees),
    msg_fees: (0, _dbSchemaTypes.grams)(_dbShema.docs.transaction.bounce.msg_fees),
    fwd_fees: (0, _dbSchemaTypes.grams)(_dbShema.docs.transaction.bounce.fwd_fees)
  },
  aborted: bool(_dbShema.docs.transaction.aborted),
  destroyed: bool(_dbShema.docs.transaction.destroyed),
  tt: string(_dbShema.docs.transaction.tt),
  split_info: {
    cur_shard_pfx_len: (0, _dbSchemaTypes.u8)(_dbShema.docs.transaction.split_info.cur_shard_pfx_len),
    acc_split_depth: (0, _dbSchemaTypes.u8)(_dbShema.docs.transaction.split_info.acc_split_depth),
    this_addr: string(_dbShema.docs.transaction.split_info.this_addr),
    sibling_addr: string(_dbShema.docs.transaction.split_info.sibling_addr)
  },
  prepare_transaction: string(_dbShema.docs.transaction.prepare_transaction),
  installed: bool(_dbShema.docs.transaction.installed),
  proof: string(_dbShema.docs.transaction.proof),
  boc: string(_dbShema.docs.transaction.boc)
}; // BLOCK SIGNATURES

const BlockSignatures = {
  _doc: _dbShema.docs.blockSignatures._doc,
  _: {
    collection: 'blocks_signatures'
  },
  gen_utime: (0, _dbSchemaTypes.unixTime)(_dbShema.docs.blockSignatures.gen_utime),
  seq_no: (0, _dbSchemaTypes.u32)(_dbShema.docs.blockSignatures.seq_no),
  shard: string(_dbShema.docs.blockSignatures.shard),
  workchain_id: (0, _dbSchemaTypes.i32)(_dbShema.docs.blockSignatures.workchain_id),
  proof: string(_dbShema.docs.blockSignatures.proof),
  validator_list_hash_short: (0, _dbSchemaTypes.u32)(_dbShema.docs.blockSignatures.validator_list_hash_short),
  catchain_seqno: (0, _dbSchemaTypes.u32)(_dbShema.docs.blockSignatures.catchain_seqno),
  sig_weight: (0, _dbSchemaTypes.u64)(_dbShema.docs.blockSignatures.sig_weight),
  signatures: arrayOf({
    node_id: string(),
    r: string(_dbShema.docs.blockSignatures.signatures.r),
    s: string(_dbShema.docs.blockSignatures.signatures.s)
  }, _dbShema.docs.blockSignatures.signatures._doc),
  block: (0, _dbSchemaTypes.join)('Block', 'id', 'id')
}; // BLOCK

const ExtBlkRef = {
  end_lt: (0, _dbSchemaTypes.u64)(),
  seq_no: (0, _dbSchemaTypes.u32)(),
  root_hash: string(),
  file_hash: string()
};

const extBlkRef = doc => ref({
  ExtBlkRef
}, doc);

const MsgEnvelope = {
  msg_id: string(),
  next_addr: string(),
  cur_addr: string(),
  fwd_fee_remaining: (0, _dbSchemaTypes.grams)()
};

const msgEnvelope = () => ref({
  MsgEnvelope
});

const InMsg = {
  msg_type: (0, _dbSchemaTypes.required)(inMsgType()),
  msg_id: string(),
  ihr_fee: (0, _dbSchemaTypes.grams)(),
  proof_created: string(),
  in_msg: msgEnvelope(),
  fwd_fee: (0, _dbSchemaTypes.grams)(),
  out_msg: msgEnvelope(),
  transit_fee: (0, _dbSchemaTypes.grams)(),
  transaction_id: string(),
  proof_delivered: string()
};

const inMsg = doc => ref({
  InMsg
}, doc);

const OutMsg = {
  msg_type: (0, _dbSchemaTypes.required)(outMsgType()),
  msg_id: string(),
  transaction_id: string(),
  out_msg: msgEnvelope(),
  reimport: inMsg(),
  imported: inMsg(),
  import_block_lt: (0, _dbSchemaTypes.u64)(),
  msg_env_hash: string(),
  next_workchain: (0, _dbSchemaTypes.i32)(),
  next_addr_pfx: (0, _dbSchemaTypes.u64)()
};

const outMsg = doc => ref({
  OutMsg
}, doc);

const shardDescr = doc => (0, _dbSchemaTypes.withDoc)({
  seq_no: (0, _dbSchemaTypes.u32)(_dbShema.docs.shardDescr.seq_no),
  reg_mc_seqno: (0, _dbSchemaTypes.u32)(_dbShema.docs.shardDescr.reg_mc_seqno),
  start_lt: (0, _dbSchemaTypes.u64)(_dbShema.docs.shardDescr.start_lt),
  end_lt: (0, _dbSchemaTypes.u64)(_dbShema.docs.shardDescr.end_lt),
  root_hash: string(_dbShema.docs.shardDescr.root_hash),
  file_hash: string(_dbShema.docs.shardDescr.file_hash),
  before_split: bool(_dbShema.docs.shardDescr.before_split),
  before_merge: bool(_dbShema.docs.shardDescr.before_merge),
  want_split: bool(_dbShema.docs.shardDescr.want_split),
  want_merge: bool(_dbShema.docs.shardDescr.want_merge),
  nx_cc_updated: bool(_dbShema.docs.shardDescr.nx_cc_updated),
  flags: (0, _dbSchemaTypes.u8)(_dbShema.docs.shardDescr.flags),
  next_catchain_seqno: (0, _dbSchemaTypes.u32)(_dbShema.docs.shardDescr.next_catchain_seqno),
  next_validator_shard: string(_dbShema.docs.shardDescr.next_validator_shard),
  min_ref_mc_seqno: (0, _dbSchemaTypes.u32)(_dbShema.docs.shardDescr.min_ref_mc_seqno),
  gen_utime: (0, _dbSchemaTypes.unixTime)(_dbShema.docs.shardDescr.gen_utime),
  split_type: splitType(_dbShema.docs.shardDescr.split_type),
  split: (0, _dbSchemaTypes.u32)(_dbShema.docs.shardDescr.split),
  fees_collected: (0, _dbSchemaTypes.grams)(_dbShema.docs.shardDescr.fees_collected),
  fees_collected_other: (0, _dbSchemaTypes.otherCurrencyCollection)(_dbShema.docs.shardDescr.fees_collected_other),
  funds_created: (0, _dbSchemaTypes.grams)(_dbShema.docs.shardDescr.funds_created),
  funds_created_other: (0, _dbSchemaTypes.otherCurrencyCollection)(_dbShema.docs.shardDescr.funds_created_other)
}, doc);

const GasLimitsPrices = {
  gas_price: (0, _dbSchemaTypes.u64)(),
  gas_limit: (0, _dbSchemaTypes.u64)(),
  special_gas_limit: (0, _dbSchemaTypes.u64)(),
  gas_credit: (0, _dbSchemaTypes.u64)(),
  block_gas_limit: (0, _dbSchemaTypes.u64)(),
  freeze_due_limit: (0, _dbSchemaTypes.u64)(),
  delete_due_limit: (0, _dbSchemaTypes.u64)(),
  flat_gas_limit: (0, _dbSchemaTypes.u64)(),
  flat_gas_price: (0, _dbSchemaTypes.u64)()
};

const gasLimitsPrices = doc => ref({
  GasLimitsPrices
}, doc);

const BlockLimits = {
  bytes: {
    underload: (0, _dbSchemaTypes.u32)(),
    soft_limit: (0, _dbSchemaTypes.u32)(),
    hard_limit: (0, _dbSchemaTypes.u32)()
  },
  gas: {
    underload: (0, _dbSchemaTypes.u32)(),
    soft_limit: (0, _dbSchemaTypes.u32)(),
    hard_limit: (0, _dbSchemaTypes.u32)()
  },
  lt_delta: {
    underload: (0, _dbSchemaTypes.u32)(),
    soft_limit: (0, _dbSchemaTypes.u32)(),
    hard_limit: (0, _dbSchemaTypes.u32)()
  }
};

const blockLimits = doc => ref({
  BlockLimits
}, doc);

const MsgForwardPrices = {
  lump_price: (0, _dbSchemaTypes.u64)(),
  bit_price: (0, _dbSchemaTypes.u64)(),
  cell_price: (0, _dbSchemaTypes.u64)(),
  ihr_price_factor: (0, _dbSchemaTypes.u32)(),
  first_frac: (0, _dbSchemaTypes.u16)(),
  next_frac: (0, _dbSchemaTypes.u16)()
};

const msgForwardPrices = doc => ref({
  MsgForwardPrices
}, doc);

const ValidatorSet = {
  utime_since: (0, _dbSchemaTypes.unixTime)(),
  utime_until: (0, _dbSchemaTypes.unixTime)(),
  total: (0, _dbSchemaTypes.u16)(),
  total_weight: (0, _dbSchemaTypes.u64)(),
  list: arrayOf({
    public_key: string(),
    weight: (0, _dbSchemaTypes.u64)(),
    adnl_addr: string()
  })
};

const validatorSet = doc => ref({
  ValidatorSet
}, doc);

const ConfigProposalSetup = {
  min_tot_rounds: (0, _dbSchemaTypes.u8)(),
  max_tot_rounds: (0, _dbSchemaTypes.u8)(),
  min_wins: (0, _dbSchemaTypes.u8)(),
  max_losses: (0, _dbSchemaTypes.u8)(),
  min_store_sec: (0, _dbSchemaTypes.u32)(),
  max_store_sec: (0, _dbSchemaTypes.u32)(),
  bit_price: (0, _dbSchemaTypes.u32)(),
  cell_price: (0, _dbSchemaTypes.u32)()
};

const configProposalSetup = doc => ref({
  ConfigProposalSetup
}, doc);

const Block = {
  _doc: _dbShema.docs.block._doc,
  _: {
    collection: 'blocks'
  },
  status: blockProcessingStatus(_dbShema.docs.block.status),
  global_id: (0, _dbSchemaTypes.u32)(_dbShema.docs.block.global_id),
  want_split: bool(_dbShema.docs.block.want_split),
  seq_no: (0, _dbSchemaTypes.u32)(_dbShema.docs.block.seq_no),
  after_merge: bool(_dbShema.docs.block.after_merge),
  gen_utime: (0, _dbSchemaTypes.unixTime)(_dbShema.docs.block.gen_utime),
  gen_catchain_seqno: (0, _dbSchemaTypes.u32)(_dbShema.docs.block.gen_catchain_seqno),
  flags: (0, _dbSchemaTypes.u16)(_dbShema.docs.block.flags),
  master_ref: extBlkRef(_dbShema.docs.block.master_ref),
  prev_ref: extBlkRef(_dbShema.docs.block.prev_ref),
  prev_alt_ref: extBlkRef(_dbShema.docs.block.prev_alt_ref),
  prev_vert_ref: extBlkRef(_dbShema.docs.block.prev_vert_ref),
  prev_vert_alt_ref: extBlkRef(_dbShema.docs.block.prev_vert_alt_ref),
  version: (0, _dbSchemaTypes.u32)(_dbShema.docs.block.version),
  gen_validator_list_hash_short: (0, _dbSchemaTypes.u32)(_dbShema.docs.block.gen_validator_list_hash_short),
  before_split: bool(_dbShema.docs.block.before_split),
  after_split: bool(_dbShema.docs.block.after_split),
  want_merge: bool(_dbShema.docs.block.want_merge),
  vert_seq_no: (0, _dbSchemaTypes.u32)(_dbShema.docs.block.vert_seq_no),
  start_lt: (0, _dbSchemaTypes.u64)(_dbShema.docs.block.start_lt),
  end_lt: (0, _dbSchemaTypes.u64)(_dbShema.docs.block.end_lt),
  workchain_id: (0, _dbSchemaTypes.i32)(_dbShema.docs.block.workchain_id),
  shard: string(_dbShema.docs.block.shard),
  min_ref_mc_seqno: (0, _dbSchemaTypes.u32)(_dbShema.docs.block.min_ref_mc_seqno),
  prev_key_block_seqno: (0, _dbSchemaTypes.u32)(_dbShema.docs.block.prev_key_block_seqno),
  gen_software_version: (0, _dbSchemaTypes.u32)(_dbShema.docs.block.gen_software_version),
  gen_software_capabilities: string(_dbShema.docs.block.gen_software_capabilities),
  value_flow: {
    to_next_blk: (0, _dbSchemaTypes.grams)(_dbShema.docs.block.value_flow.to_next_blk),
    to_next_blk_other: (0, _dbSchemaTypes.otherCurrencyCollection)(_dbShema.docs.block.value_flow.to_next_blk_other),
    exported: (0, _dbSchemaTypes.grams)(_dbShema.docs.block.value_flow.exported),
    exported_other: (0, _dbSchemaTypes.otherCurrencyCollection)(_dbShema.docs.block.value_flow.exported_other),
    fees_collected: (0, _dbSchemaTypes.grams)(_dbShema.docs.block.value_flow.fees_collected),
    fees_collected_other: (0, _dbSchemaTypes.otherCurrencyCollection)(_dbShema.docs.block.value_flow.fees_collected_other),
    created: (0, _dbSchemaTypes.grams)(_dbShema.docs.block.value_flow.created),
    created_other: (0, _dbSchemaTypes.otherCurrencyCollection)(_dbShema.docs.block.value_flow.created_other),
    imported: (0, _dbSchemaTypes.grams)(_dbShema.docs.block.value_flow.imported),
    imported_other: (0, _dbSchemaTypes.otherCurrencyCollection)(_dbShema.docs.block.value_flow.imported_other),
    from_prev_blk: (0, _dbSchemaTypes.grams)(_dbShema.docs.block.value_flow.from_prev_blk),
    from_prev_blk_other: (0, _dbSchemaTypes.otherCurrencyCollection)(_dbShema.docs.block.value_flow.from_prev_blk_other),
    minted: (0, _dbSchemaTypes.grams)(_dbShema.docs.block.value_flow.minted),
    minted_other: (0, _dbSchemaTypes.otherCurrencyCollection)(_dbShema.docs.block.value_flow.minted_other),
    fees_imported: (0, _dbSchemaTypes.grams)(_dbShema.docs.block.value_flow.fees_imported),
    fees_imported_other: (0, _dbSchemaTypes.otherCurrencyCollection)(_dbShema.docs.block.value_flow.fees_imported_other)
  },
  in_msg_descr: arrayOf(inMsg(_dbShema.docs.block.in_msg_descr)),
  rand_seed: string(_dbShema.docs.block.rand_seed),
  out_msg_descr: arrayOf(outMsg(_dbShema.docs.block.out_msg_descr)),
  account_blocks: arrayOf({
    account_addr: string(_dbShema.docs.block.account_blocks.account_addr),
    transactions: arrayOf({
      lt: (0, _dbSchemaTypes.u64)(),
      // TODO: doc
      transaction_id: string(),
      // TODO: doc
      total_fees: (0, _dbSchemaTypes.grams)(),
      // TODO: doc
      total_fees_other: (0, _dbSchemaTypes.otherCurrencyCollection)() // TODO: doc

    }, _dbShema.docs.block.account_blocks.transactions),
    old_hash: string(_dbShema.docs.block.account_blocks.state_update.old_hash),
    new_hash: string(_dbShema.docs.block.account_blocks.state_update.new_hash),
    tr_count: (0, _dbSchemaTypes.i32)(_dbShema.docs.block.account_blocks.tr_count)
  }),
  tr_count: (0, _dbSchemaTypes.i32)(),
  // TODO: doc
  state_update: {
    new: string(_dbShema.docs.block.state_update.new),
    new_hash: string(_dbShema.docs.block.state_update.new_hash),
    new_depth: (0, _dbSchemaTypes.u16)(_dbShema.docs.block.state_update.new_depth),
    old: string(_dbShema.docs.block.state_update.old),
    old_hash: string(_dbShema.docs.block.state_update.old_hash),
    old_depth: (0, _dbSchemaTypes.u16)(_dbShema.docs.block.state_update.old_depth)
  },
  master: {
    min_shard_gen_utime: (0, _dbSchemaTypes.unixTime)(_dbShema.docs.block.master.min_shard_gen_utime),
    max_shard_gen_utime: (0, _dbSchemaTypes.unixTime)(_dbShema.docs.block.master.max_shard_gen_utime),
    shard_hashes: arrayOf({
      workchain_id: (0, _dbSchemaTypes.i32)(_dbShema.docs.block.master.shard_hashes.workchain_id),
      shard: string(_dbShema.docs.block.master.shard_hashes.shard),
      descr: shardDescr(_dbShema.docs.block.master.shard_hashes.descr)
    }),
    shard_fees: arrayOf({
      workchain_id: (0, _dbSchemaTypes.i32)(_dbShema.docs.block.master.shard_fees.workchain_id),
      shard: string(_dbShema.docs.block.master.shard_fees.shard),
      fees: (0, _dbSchemaTypes.grams)(_dbShema.docs.block.master.shard_fees.fees),
      fees_other: (0, _dbSchemaTypes.otherCurrencyCollection)(_dbShema.docs.block.master.shard_fees.fees_other),
      create: (0, _dbSchemaTypes.grams)(_dbShema.docs.block.master.shard_fees.create),
      create_other: (0, _dbSchemaTypes.otherCurrencyCollection)(_dbShema.docs.block.master.shard_fees.create_other)
    }),
    recover_create_msg: inMsg(_dbShema.docs.block.master.recover_create_msg),
    prev_blk_signatures: arrayOf({
      node_id: string(_dbShema.docs.block.master.prev_blk_signatures.node_id),
      r: string(_dbShema.docs.block.master.prev_blk_signatures.r),
      s: string(_dbShema.docs.block.master.prev_blk_signatures.s)
    }),
    config_addr: string(),
    config: {
      p0: string(_dbShema.docs.block.master.config.p0),
      p1: string(_dbShema.docs.block.master.config.p1),
      p2: string(_dbShema.docs.block.master.config.p2),
      p3: string(_dbShema.docs.block.master.config.p3),
      p4: string(_dbShema.docs.block.master.config.p4),
      p6: {
        _doc: _dbShema.docs.block.master.config.p6._doc,
        mint_new_price: string(),
        mint_add_price: string()
      },
      p7: arrayOf({
        currency: (0, _dbSchemaTypes.u32)(),
        value: string()
      }, _dbShema.docs.block.master.config.p7._doc),
      p8: {
        _doc: _dbShema.docs.block.master.config.p8._doc,
        version: (0, _dbSchemaTypes.u32)(),
        capabilities: string()
      },
      p9: arrayOf((0, _dbSchemaTypes.u32)(), _dbShema.docs.block.master.config.p9._doc),
      p10: arrayOf((0, _dbSchemaTypes.u32)(), _dbShema.docs.block.master.config.p10._doc),
      p11: {
        _doc: _dbShema.docs.block.master.config.p11._doc,
        normal_params: configProposalSetup(_dbShema.docs.block.master.config.p11.normal_params),
        critical_params: configProposalSetup(_dbShema.docs.block.master.config.p11.critical_params)
      },
      p12: arrayOf({
        workchain_id: (0, _dbSchemaTypes.i32)(),
        enabled_since: (0, _dbSchemaTypes.u32)(),
        actual_min_split: (0, _dbSchemaTypes.u8)(),
        min_split: (0, _dbSchemaTypes.u8)(),
        max_split: (0, _dbSchemaTypes.u8)(),
        active: bool(),
        accept_msgs: bool(),
        flags: (0, _dbSchemaTypes.u16)(),
        zerostate_root_hash: string(),
        zerostate_file_hash: string(),
        version: (0, _dbSchemaTypes.u32)(),
        basic: bool(),
        vm_version: (0, _dbSchemaTypes.i32)(),
        vm_mode: string(),
        min_addr_len: (0, _dbSchemaTypes.u16)(),
        max_addr_len: (0, _dbSchemaTypes.u16)(),
        addr_len_step: (0, _dbSchemaTypes.u16)(),
        workchain_type_id: (0, _dbSchemaTypes.u32)()
      }, _dbShema.docs.block.master.config.p12._doc),
      p14: {
        _doc: _dbShema.docs.block.master.config.p14._doc,
        masterchain_block_fee: (0, _dbSchemaTypes.grams)(),
        basechain_block_fee: (0, _dbSchemaTypes.grams)()
      },
      p15: {
        _doc: _dbShema.docs.block.master.config.p15._doc,
        validators_elected_for: (0, _dbSchemaTypes.u32)(),
        elections_start_before: (0, _dbSchemaTypes.u32)(),
        elections_end_before: (0, _dbSchemaTypes.u32)(),
        stake_held_for: (0, _dbSchemaTypes.u32)()
      },
      p16: {
        _doc: _dbShema.docs.block.master.config.p16._doc,
        max_validators: (0, _dbSchemaTypes.u16)(),
        max_main_validators: (0, _dbSchemaTypes.u16)(),
        min_validators: (0, _dbSchemaTypes.u16)()
      },
      p17: {
        _doc: _dbShema.docs.block.master.config.p17._doc,
        min_stake: (0, _dbSchemaTypes.u128)(),
        max_stake: (0, _dbSchemaTypes.u128)(),
        min_total_stake: (0, _dbSchemaTypes.u128)(),
        max_stake_factor: (0, _dbSchemaTypes.u32)()
      },
      p18: arrayOf({
        utime_since: (0, _dbSchemaTypes.unixTime)(),
        bit_price_ps: (0, _dbSchemaTypes.u64)(),
        cell_price_ps: (0, _dbSchemaTypes.u64)(),
        mc_bit_price_ps: (0, _dbSchemaTypes.u64)(),
        mc_cell_price_ps: (0, _dbSchemaTypes.u64)()
      }, _dbShema.docs.block.master.config.p18._doc),
      p20: gasLimitsPrices(_dbShema.docs.block.master.config.p20),
      p21: gasLimitsPrices(_dbShema.docs.block.master.config.p21),
      p22: blockLimits(_dbShema.docs.block.master.config.p22),
      p23: blockLimits(_dbShema.docs.block.master.config.p23),
      p24: msgForwardPrices(_dbShema.docs.block.master.config.p24),
      p25: msgForwardPrices(_dbShema.docs.block.master.config.p25),
      p28: {
        _doc: _dbShema.docs.block.master.config.p28._doc,
        shuffle_mc_validators: bool(),
        mc_catchain_lifetime: (0, _dbSchemaTypes.u32)(),
        shard_catchain_lifetime: (0, _dbSchemaTypes.u32)(),
        shard_validators_lifetime: (0, _dbSchemaTypes.u32)(),
        shard_validators_num: (0, _dbSchemaTypes.u32)()
      },
      p29: {
        _doc: _dbShema.docs.block.master.config.p29._doc,
        new_catchain_ids: bool(),
        round_candidates: (0, _dbSchemaTypes.u32)(),
        next_candidate_delay_ms: (0, _dbSchemaTypes.u32)(),
        consensus_timeout_ms: (0, _dbSchemaTypes.u32)(),
        fast_attempts: (0, _dbSchemaTypes.u32)(),
        attempt_duration: (0, _dbSchemaTypes.u32)(),
        catchain_max_deps: (0, _dbSchemaTypes.u32)(),
        max_block_bytes: (0, _dbSchemaTypes.u32)(),
        max_collated_bytes: (0, _dbSchemaTypes.u32)()
      },
      p31: arrayOf(string(), _dbShema.docs.block.master.config.p31._doc),
      p32: validatorSet(_dbShema.docs.block.master.config.p32),
      p33: validatorSet(_dbShema.docs.block.master.config.p33),
      p34: validatorSet(_dbShema.docs.block.master.config.p34),
      p35: validatorSet(_dbShema.docs.block.master.config.p35),
      p36: validatorSet(_dbShema.docs.block.master.config.p36),
      p37: validatorSet(_dbShema.docs.block.master.config.p37),
      p39: arrayOf({
        adnl_addr: string(),
        temp_public_key: string(),
        seqno: (0, _dbSchemaTypes.u32)(),
        valid_until: (0, _dbSchemaTypes.u32)(),
        signature_r: string(),
        signature_s: string()
      }, _dbShema.docs.block.master.config.p39._doc)
    }
  },
  key_block: bool(_dbShema.docs.block.key_block),
  boc: string(_dbShema.docs.block.boc),
  signatures: (0, _dbSchemaTypes.join)({
    BlockSignatures
  }, 'id', 'id')
}; //Root scheme declaration

const schema = {
  _class: {
    types: {
      OtherCurrency: _dbSchemaTypes.OtherCurrency,
      ExtBlkRef,
      MsgEnvelope,
      InMsg,
      OutMsg,
      Message,
      Block,
      Account,
      Transaction,
      BlockSignatures,
      GasLimitsPrices,
      BlockLimits,
      MsgForwardPrices,
      ValidatorSet,
      ConfigProposalSetup
    }
  }
};
var _default = schema;
exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NlcnZlci9zY2hlbWEvZGItc2NoZW1hLmpzIl0sIm5hbWVzIjpbInN0cmluZyIsImJvb2wiLCJyZWYiLCJhcnJheU9mIiwiRGVmIiwiYWNjb3VudFN0YXR1cyIsInVuaW5pdCIsImFjdGl2ZSIsImZyb3plbiIsIm5vbkV4aXN0IiwiYWNjb3VudFN0YXR1c0NoYW5nZSIsInVuY2hhbmdlZCIsImRlbGV0ZWQiLCJza2lwUmVhc29uIiwibm9TdGF0ZSIsImJhZFN0YXRlIiwibm9HYXMiLCJhY2NvdW50VHlwZSIsIm1lc3NhZ2VUeXBlIiwiaW50ZXJuYWwiLCJleHRJbiIsImV4dE91dCIsIm1lc3NhZ2VQcm9jZXNzaW5nU3RhdHVzIiwidW5rbm93biIsInF1ZXVlZCIsInByb2Nlc3NpbmciLCJwcmVsaW1pbmFyeSIsInByb3Bvc2VkIiwiZmluYWxpemVkIiwicmVmdXNlZCIsInRyYW5zaXRpbmciLCJ0cmFuc2FjdGlvblR5cGUiLCJvcmRpbmFyeSIsInN0b3JhZ2UiLCJ0aWNrIiwidG9jayIsInNwbGl0UHJlcGFyZSIsInNwbGl0SW5zdGFsbCIsIm1lcmdlUHJlcGFyZSIsIm1lcmdlSW5zdGFsbCIsInRyYW5zYWN0aW9uUHJvY2Vzc2luZ1N0YXR1cyIsImNvbXB1dGVUeXBlIiwic2tpcHBlZCIsInZtIiwiYm91bmNlVHlwZSIsIm5lZ0Z1bmRzIiwibm9GdW5kcyIsIm9rIiwiYmxvY2tQcm9jZXNzaW5nU3RhdHVzIiwiaW5Nc2dUeXBlIiwiZXh0ZXJuYWwiLCJpaHIiLCJpbW1lZGlhdGVseSIsImZpbmFsIiwidHJhbnNpdCIsImRpc2NhcmRlZEZpbmFsIiwiZGlzY2FyZGVkVHJhbnNpdCIsIm91dE1zZ1R5cGUiLCJvdXRNc2dOZXciLCJkZXF1ZXVlSW1tZWRpYXRlbHkiLCJkZXF1ZXVlIiwidHJhbnNpdFJlcXVpcmVkIiwiZGVxdWV1ZVNob3J0Iiwibm9uZSIsInNwbGl0VHlwZSIsInNwbGl0IiwibWVyZ2UiLCJBY2NvdW50IiwiX2RvYyIsImRvY3MiLCJhY2NvdW50IiwiXyIsImNvbGxlY3Rpb24iLCJ3b3JrY2hhaW5faWQiLCJhY2NfdHlwZSIsImxhc3RfcGFpZCIsImR1ZV9wYXltZW50IiwibGFzdF90cmFuc19sdCIsImJhbGFuY2UiLCJiYWxhbmNlX290aGVyIiwic3BsaXRfZGVwdGgiLCJjb2RlIiwiY29kZV9oYXNoIiwiZGF0YSIsImRhdGFfaGFzaCIsImxpYnJhcnkiLCJsaWJyYXJ5X2hhc2giLCJwcm9vZiIsImJvYyIsIk1lc3NhZ2UiLCJtZXNzYWdlIiwibXNnX3R5cGUiLCJzdGF0dXMiLCJibG9ja19pZCIsImJsb2NrIiwiYm9keSIsImJvZHlfaGFzaCIsInNyYyIsImRzdCIsInNyY193b3JrY2hhaW5faWQiLCJkc3Rfd29ya2NoYWluX2lkIiwiY3JlYXRlZF9sdCIsImNyZWF0ZWRfYXQiLCJpaHJfZGlzYWJsZWQiLCJpaHJfZmVlIiwiZndkX2ZlZSIsImltcG9ydF9mZWUiLCJib3VuY2UiLCJib3VuY2VkIiwidmFsdWUiLCJ2YWx1ZV9vdGhlciIsInNyY190cmFuc2FjdGlvbiIsImRzdF90cmFuc2FjdGlvbiIsIlRyYW5zYWN0aW9uIiwidHJhbnNhY3Rpb24iLCJ0cl90eXBlIiwiYWNjb3VudF9hZGRyIiwibHQiLCJwcmV2X3RyYW5zX2hhc2giLCJwcmV2X3RyYW5zX2x0Iiwibm93Iiwib3V0bXNnX2NudCIsIm9yaWdfc3RhdHVzIiwiZW5kX3N0YXR1cyIsImluX21zZyIsImluX21lc3NhZ2UiLCJvdXRfbXNncyIsIm91dF9tZXNzYWdlcyIsInRvdGFsX2ZlZXMiLCJ0b3RhbF9mZWVzX290aGVyIiwib2xkX2hhc2giLCJuZXdfaGFzaCIsImNyZWRpdF9maXJzdCIsInN0b3JhZ2VfZmVlc19jb2xsZWN0ZWQiLCJzdG9yYWdlX2ZlZXNfZHVlIiwic3RhdHVzX2NoYW5nZSIsImNyZWRpdCIsImR1ZV9mZWVzX2NvbGxlY3RlZCIsImNyZWRpdF9vdGhlciIsImNvbXB1dGUiLCJjb21wdXRlX3R5cGUiLCJza2lwcGVkX3JlYXNvbiIsInN1Y2Nlc3MiLCJtc2dfc3RhdGVfdXNlZCIsImFjY291bnRfYWN0aXZhdGVkIiwiZ2FzX2ZlZXMiLCJnYXNfdXNlZCIsImdhc19saW1pdCIsImdhc19jcmVkaXQiLCJtb2RlIiwiZXhpdF9jb2RlIiwiZXhpdF9hcmciLCJ2bV9zdGVwcyIsInZtX2luaXRfc3RhdGVfaGFzaCIsInZtX2ZpbmFsX3N0YXRlX2hhc2giLCJhY3Rpb24iLCJ2YWxpZCIsIm5vX2Z1bmRzIiwidG90YWxfZndkX2ZlZXMiLCJ0b3RhbF9hY3Rpb25fZmVlcyIsInJlc3VsdF9jb2RlIiwicmVzdWx0X2FyZyIsInRvdF9hY3Rpb25zIiwic3BlY19hY3Rpb25zIiwic2tpcHBlZF9hY3Rpb25zIiwibXNnc19jcmVhdGVkIiwiYWN0aW9uX2xpc3RfaGFzaCIsInRvdGFsX21zZ19zaXplX2NlbGxzIiwidG90YWxfbXNnX3NpemVfYml0cyIsImJvdW5jZV90eXBlIiwibXNnX3NpemVfY2VsbHMiLCJtc2dfc2l6ZV9iaXRzIiwicmVxX2Z3ZF9mZWVzIiwibXNnX2ZlZXMiLCJmd2RfZmVlcyIsImFib3J0ZWQiLCJkZXN0cm95ZWQiLCJ0dCIsInNwbGl0X2luZm8iLCJjdXJfc2hhcmRfcGZ4X2xlbiIsImFjY19zcGxpdF9kZXB0aCIsInRoaXNfYWRkciIsInNpYmxpbmdfYWRkciIsInByZXBhcmVfdHJhbnNhY3Rpb24iLCJpbnN0YWxsZWQiLCJCbG9ja1NpZ25hdHVyZXMiLCJibG9ja1NpZ25hdHVyZXMiLCJnZW5fdXRpbWUiLCJzZXFfbm8iLCJzaGFyZCIsInZhbGlkYXRvcl9saXN0X2hhc2hfc2hvcnQiLCJjYXRjaGFpbl9zZXFubyIsInNpZ193ZWlnaHQiLCJzaWduYXR1cmVzIiwibm9kZV9pZCIsInIiLCJzIiwiRXh0QmxrUmVmIiwiZW5kX2x0Iiwicm9vdF9oYXNoIiwiZmlsZV9oYXNoIiwiZXh0QmxrUmVmIiwiZG9jIiwiTXNnRW52ZWxvcGUiLCJtc2dfaWQiLCJuZXh0X2FkZHIiLCJjdXJfYWRkciIsImZ3ZF9mZWVfcmVtYWluaW5nIiwibXNnRW52ZWxvcGUiLCJJbk1zZyIsInByb29mX2NyZWF0ZWQiLCJvdXRfbXNnIiwidHJhbnNpdF9mZWUiLCJ0cmFuc2FjdGlvbl9pZCIsInByb29mX2RlbGl2ZXJlZCIsImluTXNnIiwiT3V0TXNnIiwicmVpbXBvcnQiLCJpbXBvcnRlZCIsImltcG9ydF9ibG9ja19sdCIsIm1zZ19lbnZfaGFzaCIsIm5leHRfd29ya2NoYWluIiwibmV4dF9hZGRyX3BmeCIsIm91dE1zZyIsInNoYXJkRGVzY3IiLCJyZWdfbWNfc2Vxbm8iLCJzdGFydF9sdCIsImJlZm9yZV9zcGxpdCIsImJlZm9yZV9tZXJnZSIsIndhbnRfc3BsaXQiLCJ3YW50X21lcmdlIiwibnhfY2NfdXBkYXRlZCIsImZsYWdzIiwibmV4dF9jYXRjaGFpbl9zZXFubyIsIm5leHRfdmFsaWRhdG9yX3NoYXJkIiwibWluX3JlZl9tY19zZXFubyIsInNwbGl0X3R5cGUiLCJmZWVzX2NvbGxlY3RlZCIsImZlZXNfY29sbGVjdGVkX290aGVyIiwiZnVuZHNfY3JlYXRlZCIsImZ1bmRzX2NyZWF0ZWRfb3RoZXIiLCJHYXNMaW1pdHNQcmljZXMiLCJnYXNfcHJpY2UiLCJzcGVjaWFsX2dhc19saW1pdCIsImJsb2NrX2dhc19saW1pdCIsImZyZWV6ZV9kdWVfbGltaXQiLCJkZWxldGVfZHVlX2xpbWl0IiwiZmxhdF9nYXNfbGltaXQiLCJmbGF0X2dhc19wcmljZSIsImdhc0xpbWl0c1ByaWNlcyIsIkJsb2NrTGltaXRzIiwiYnl0ZXMiLCJ1bmRlcmxvYWQiLCJzb2Z0X2xpbWl0IiwiaGFyZF9saW1pdCIsImdhcyIsImx0X2RlbHRhIiwiYmxvY2tMaW1pdHMiLCJNc2dGb3J3YXJkUHJpY2VzIiwibHVtcF9wcmljZSIsImJpdF9wcmljZSIsImNlbGxfcHJpY2UiLCJpaHJfcHJpY2VfZmFjdG9yIiwiZmlyc3RfZnJhYyIsIm5leHRfZnJhYyIsIm1zZ0ZvcndhcmRQcmljZXMiLCJWYWxpZGF0b3JTZXQiLCJ1dGltZV9zaW5jZSIsInV0aW1lX3VudGlsIiwidG90YWwiLCJ0b3RhbF93ZWlnaHQiLCJsaXN0IiwicHVibGljX2tleSIsIndlaWdodCIsImFkbmxfYWRkciIsInZhbGlkYXRvclNldCIsIkNvbmZpZ1Byb3Bvc2FsU2V0dXAiLCJtaW5fdG90X3JvdW5kcyIsIm1heF90b3Rfcm91bmRzIiwibWluX3dpbnMiLCJtYXhfbG9zc2VzIiwibWluX3N0b3JlX3NlYyIsIm1heF9zdG9yZV9zZWMiLCJjb25maWdQcm9wb3NhbFNldHVwIiwiQmxvY2siLCJnbG9iYWxfaWQiLCJhZnRlcl9tZXJnZSIsImdlbl9jYXRjaGFpbl9zZXFubyIsIm1hc3Rlcl9yZWYiLCJwcmV2X3JlZiIsInByZXZfYWx0X3JlZiIsInByZXZfdmVydF9yZWYiLCJwcmV2X3ZlcnRfYWx0X3JlZiIsInZlcnNpb24iLCJnZW5fdmFsaWRhdG9yX2xpc3RfaGFzaF9zaG9ydCIsImFmdGVyX3NwbGl0IiwidmVydF9zZXFfbm8iLCJwcmV2X2tleV9ibG9ja19zZXFubyIsImdlbl9zb2Z0d2FyZV92ZXJzaW9uIiwiZ2VuX3NvZnR3YXJlX2NhcGFiaWxpdGllcyIsInZhbHVlX2Zsb3ciLCJ0b19uZXh0X2JsayIsInRvX25leHRfYmxrX290aGVyIiwiZXhwb3J0ZWQiLCJleHBvcnRlZF9vdGhlciIsImNyZWF0ZWQiLCJjcmVhdGVkX290aGVyIiwiaW1wb3J0ZWRfb3RoZXIiLCJmcm9tX3ByZXZfYmxrIiwiZnJvbV9wcmV2X2Jsa19vdGhlciIsIm1pbnRlZCIsIm1pbnRlZF9vdGhlciIsImZlZXNfaW1wb3J0ZWQiLCJmZWVzX2ltcG9ydGVkX290aGVyIiwiaW5fbXNnX2Rlc2NyIiwicmFuZF9zZWVkIiwib3V0X21zZ19kZXNjciIsImFjY291bnRfYmxvY2tzIiwidHJhbnNhY3Rpb25zIiwic3RhdGVfdXBkYXRlIiwidHJfY291bnQiLCJuZXciLCJuZXdfZGVwdGgiLCJvbGQiLCJvbGRfZGVwdGgiLCJtYXN0ZXIiLCJtaW5fc2hhcmRfZ2VuX3V0aW1lIiwibWF4X3NoYXJkX2dlbl91dGltZSIsInNoYXJkX2hhc2hlcyIsImRlc2NyIiwic2hhcmRfZmVlcyIsImZlZXMiLCJmZWVzX290aGVyIiwiY3JlYXRlIiwiY3JlYXRlX290aGVyIiwicmVjb3Zlcl9jcmVhdGVfbXNnIiwicHJldl9ibGtfc2lnbmF0dXJlcyIsImNvbmZpZ19hZGRyIiwiY29uZmlnIiwicDAiLCJwMSIsInAyIiwicDMiLCJwNCIsInA2IiwibWludF9uZXdfcHJpY2UiLCJtaW50X2FkZF9wcmljZSIsInA3IiwiY3VycmVuY3kiLCJwOCIsImNhcGFiaWxpdGllcyIsInA5IiwicDEwIiwicDExIiwibm9ybWFsX3BhcmFtcyIsImNyaXRpY2FsX3BhcmFtcyIsInAxMiIsImVuYWJsZWRfc2luY2UiLCJhY3R1YWxfbWluX3NwbGl0IiwibWluX3NwbGl0IiwibWF4X3NwbGl0IiwiYWNjZXB0X21zZ3MiLCJ6ZXJvc3RhdGVfcm9vdF9oYXNoIiwiemVyb3N0YXRlX2ZpbGVfaGFzaCIsImJhc2ljIiwidm1fdmVyc2lvbiIsInZtX21vZGUiLCJtaW5fYWRkcl9sZW4iLCJtYXhfYWRkcl9sZW4iLCJhZGRyX2xlbl9zdGVwIiwid29ya2NoYWluX3R5cGVfaWQiLCJwMTQiLCJtYXN0ZXJjaGFpbl9ibG9ja19mZWUiLCJiYXNlY2hhaW5fYmxvY2tfZmVlIiwicDE1IiwidmFsaWRhdG9yc19lbGVjdGVkX2ZvciIsImVsZWN0aW9uc19zdGFydF9iZWZvcmUiLCJlbGVjdGlvbnNfZW5kX2JlZm9yZSIsInN0YWtlX2hlbGRfZm9yIiwicDE2IiwibWF4X3ZhbGlkYXRvcnMiLCJtYXhfbWFpbl92YWxpZGF0b3JzIiwibWluX3ZhbGlkYXRvcnMiLCJwMTciLCJtaW5fc3Rha2UiLCJtYXhfc3Rha2UiLCJtaW5fdG90YWxfc3Rha2UiLCJtYXhfc3Rha2VfZmFjdG9yIiwicDE4IiwiYml0X3ByaWNlX3BzIiwiY2VsbF9wcmljZV9wcyIsIm1jX2JpdF9wcmljZV9wcyIsIm1jX2NlbGxfcHJpY2VfcHMiLCJwMjAiLCJwMjEiLCJwMjIiLCJwMjMiLCJwMjQiLCJwMjUiLCJwMjgiLCJzaHVmZmxlX21jX3ZhbGlkYXRvcnMiLCJtY19jYXRjaGFpbl9saWZldGltZSIsInNoYXJkX2NhdGNoYWluX2xpZmV0aW1lIiwic2hhcmRfdmFsaWRhdG9yc19saWZldGltZSIsInNoYXJkX3ZhbGlkYXRvcnNfbnVtIiwicDI5IiwibmV3X2NhdGNoYWluX2lkcyIsInJvdW5kX2NhbmRpZGF0ZXMiLCJuZXh0X2NhbmRpZGF0ZV9kZWxheV9tcyIsImNvbnNlbnN1c190aW1lb3V0X21zIiwiZmFzdF9hdHRlbXB0cyIsImF0dGVtcHRfZHVyYXRpb24iLCJjYXRjaGFpbl9tYXhfZGVwcyIsIm1heF9ibG9ja19ieXRlcyIsIm1heF9jb2xsYXRlZF9ieXRlcyIsInAzMSIsInAzMiIsInAzMyIsInAzNCIsInAzNSIsInAzNiIsInAzNyIsInAzOSIsInRlbXBfcHVibGljX2tleSIsInNlcW5vIiwidmFsaWRfdW50aWwiLCJzaWduYXR1cmVfciIsInNpZ25hdHVyZV9zIiwia2V5X2Jsb2NrIiwic2NoZW1hIiwiX2NsYXNzIiwidHlwZXMiLCJPdGhlckN1cnJlbmN5Il0sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBa0JBOztBQUdBOztBQWtCQTs7QUF2Q0E7Ozs7Ozs7Ozs7Ozs7OztBQXlDQSxNQUFNO0FBQUVBLEVBQUFBLE1BQUY7QUFBVUMsRUFBQUEsSUFBVjtBQUFnQkMsRUFBQUEsR0FBaEI7QUFBcUJDLEVBQUFBO0FBQXJCLElBQWlDQyxXQUF2QztBQUdBLE1BQU1DLGFBQWEsR0FBRywyQkFBTyxlQUFQLEVBQXdCO0FBQzFDQyxFQUFBQSxNQUFNLEVBQUUsQ0FEa0M7QUFFMUNDLEVBQUFBLE1BQU0sRUFBRSxDQUZrQztBQUcxQ0MsRUFBQUEsTUFBTSxFQUFFLENBSGtDO0FBSTFDQyxFQUFBQSxRQUFRLEVBQUU7QUFKZ0MsQ0FBeEIsQ0FBdEI7QUFPQSxNQUFNQyxtQkFBbUIsR0FBRywyQkFBTyxxQkFBUCxFQUE4QjtBQUN0REMsRUFBQUEsU0FBUyxFQUFFLENBRDJDO0FBRXRESCxFQUFBQSxNQUFNLEVBQUUsQ0FG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QixJQUExQixFQUFnQyxJQUFoQztBQTdOTyxDQUF2QixDLENBZ09BOztBQUVBLE1BQU1vUCxNQUFlLEdBQUc7QUFDcEJDLEVBQUFBLE1BQU0sRUFBRTtBQUNKQyxJQUFBQSxLQUFLLEVBQUU7QUFDSEMsTUFBQUEsYUFBYSxFQUFiQSw0QkFERztBQUVIM08sTUFBQUEsU0FGRztBQUdITSxNQUFBQSxXQUhHO0FBSUhNLE1BQUFBLEtBSkc7QUFLSE8sTUFBQUEsTUFMRztBQU1IL0gsTUFBQUEsT0FORztBQU9IbU0sTUFBQUEsS0FQRztBQVFIek4sTUFBQUEsT0FSRztBQVNIOEMsTUFBQUEsV0FURztBQVVId0UsTUFBQUEsZUFWRztBQVdId0QsTUFBQUEsZUFYRztBQVlIUyxNQUFBQSxXQVpHO0FBYUhRLE1BQUFBLGdCQWJHO0FBY0hRLE1BQUFBLFlBZEc7QUFlSFUsTUFBQUE7QUFmRztBQURIO0FBRFksQ0FBeEI7ZUFzQmV5SixNIiwic291cmNlc0NvbnRlbnQiOlsiLypcbiAqIENvcHlyaWdodCAyMDE4LTIwMjAgVE9OIERFViBTT0xVVElPTlMgTFRELlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBTT0ZUV0FSRSBFVkFMVUFUSU9OIExpY2Vuc2UgKHRoZSBcIkxpY2Vuc2VcIik7IHlvdSBtYXkgbm90IHVzZVxuICogdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlXG4gKiBMaWNlbnNlIGF0OlxuICpcbiAqIGh0dHA6Ly93d3cudG9uLmRldi9saWNlbnNlc1xuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgVE9OIERFViBzb2Z0d2FyZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG4vL0BmbG93XG5cbmltcG9ydCB7IERlZiB9IGZyb20gJ3Rvbi1sYWJzLWRldi1vcHMvZGlzdC9zcmMvc2NoZW1hJztcblxuaW1wb3J0IHR5cGUgeyBUeXBlRGVmIH0gZnJvbSAndG9uLWxhYnMtZGV2LW9wcy9zcmMvc2NoZW1hJztcbmltcG9ydCB7XG4gICAgZ3JhbXMsXG4gICAgaTMyLFxuICAgIGk4LFxuICAgIGpvaW4sXG4gICAgT3RoZXJDdXJyZW5jeSxcbiAgICBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbixcbiAgICByZXF1aXJlZCxcbiAgICB1MTYsXG4gICAgdTMyLFxuICAgIHU2NCxcbiAgICB1MTI4LFxuICAgIHU4LFxuICAgIHU4ZW51bSxcbiAgICB1bml4VGltZSxcbiAgICB3aXRoRG9jXG59IGZyb20gXCIuL2RiLXNjaGVtYS10eXBlc1wiO1xuXG5pbXBvcnQgeyBkb2NzIH0gZnJvbSAnLi9kYi5zaGVtYS5kb2NzJztcblxuY29uc3QgeyBzdHJpbmcsIGJvb2wsIHJlZiwgYXJyYXlPZiB9ID0gRGVmO1xuXG5cbmNvbnN0IGFjY291bnRTdGF0dXMgPSB1OGVudW0oJ0FjY291bnRTdGF0dXMnLCB7XG4gICAgdW5pbml0OiAwLFxuICAgIGFjdGl2ZTogMSxcbiAgICBmcm96ZW46IDIsXG4gICAgbm9uRXhpc3Q6IDMsXG59KTtcblxuY29uc3QgYWNjb3VudFN0YXR1c0NoYW5nZSA9IHU4ZW51bSgnQWNjb3VudFN0YXR1c0NoYW5nZScsIHtcbiAgICB1bmNoYW5nZWQ6IDAsXG4gICAgZnJvemVuOiAxLFxuICAgIGRlbGV0ZWQ6IDIsXG59KTtcblxuY29uc3Qgc2tpcFJlYXNvbiA9IHU4ZW51bSgnU2tpcFJlYXNvbicsIHtcbiAgICBub1N0YXRlOiAwLFxuICAgIGJhZFN0YXRlOiAxLFxuICAgIG5vR2FzOiAyLFxufSk7XG5cblxuY29uc3QgYWNjb3VudFR5cGUgPSB1OGVudW0oJ0FjY291bnRUeXBlJywge1xuICAgIHVuaW5pdDogMCxcbiAgICBhY3RpdmU6IDEsXG4gICAgZnJvemVuOiAyLFxufSk7XG5cbmNvbnN0IG1lc3NhZ2VUeXBlID0gdThlbnVtKCdNZXNzYWdlVHlwZScsIHtcbiAgICBpbnRlcm5hbDogMCxcbiAgICBleHRJbjogMSxcbiAgICBleHRPdXQ6IDIsXG59KTtcblxuXG5jb25zdCBtZXNzYWdlUHJvY2Vzc2luZ1N0YXR1cyA9IHU4ZW51bSgnTWVzc2FnZVByb2Nlc3NpbmdTdGF0dXMnLCB7XG4gICAgdW5rbm93bjogMCxcbiAgICBxdWV1ZWQ6IDEsXG4gICAgcHJvY2Vzc2luZzogMixcbiAgICBwcmVsaW1pbmFyeTogMyxcbiAgICBwcm9wb3NlZDogNCxcbiAgICBmaW5hbGl6ZWQ6IDUsXG4gICAgcmVmdXNlZDogNixcbiAgICB0cmFuc2l0aW5nOiA3LFxufSk7XG5cbmNvbnN0IHRyYW5zYWN0aW9uVHlwZSA9IHU4ZW51bSgnVHJhbnNhY3Rpb25UeXBlJywge1xuICAgIG9yZGluYXJ5OiAwLFxuICAgIHN0b3JhZ2U6IDEsXG4gICAgdGljazogMixcbiAgICB0b2NrOiAzLFxuICAgIHNwbGl0UHJlcGFyZTogNCxcbiAgICBzcGxpdEluc3RhbGw6IDUsXG4gICAgbWVyZ2VQcmVwYXJlOiA2LFxuICAgIG1lcmdlSW5zdGFsbDogNyxcbn0pO1xuXG5jb25zdCB0cmFuc2FjdGlvblByb2Nlc3NpbmdTdGF0dXMgPSB1OGVudW0oJ1RyYW5zYWN0aW9uUHJvY2Vzc2luZ1N0YXR1cycsIHtcbiAgICB1bmtub3duOiAwLFxuICAgIHByZWxpbWluYXJ5OiAxLFxuICAgIHByb3Bvc2VkOiAyLFxuICAgIGZpbmFsaXplZDogMyxcbiAgICByZWZ1c2VkOiA0LFxufSk7XG5cbmNvbnN0IGNvbXB1dGVUeXBlID0gdThlbnVtKCdDb21wdXRlVHlwZScsIHtcbiAgICBza2lwcGVkOiAwLFxuICAgIHZtOiAxLFxufSk7XG5cbmNvbnN0IGJvdW5jZVR5cGUgPSB1OGVudW0oJ0JvdW5jZVR5cGUnLCB7XG4gICAgbmVnRnVuZHM6IDAsXG4gICAgbm9GdW5kczogMSxcbiAgICBvazogMixcbn0pO1xuXG5jb25zdCBibG9ja1Byb2Nlc3NpbmdTdGF0dXMgPSB1OGVudW0oJ0Jsb2NrUHJvY2Vzc2luZ1N0YXR1cycsIHtcbiAgICB1bmtub3duOiAwLFxuICAgIHByb3Bvc2VkOiAxLFxuICAgIGZpbmFsaXplZDogMixcbiAgICByZWZ1c2VkOiAzLFxufSk7XG5cblxuY29uc3QgaW5Nc2dUeXBlID0gdThlbnVtKCdJbk1zZ1R5cGUnLCB7XG4gICAgZXh0ZXJuYWw6IDAsXG4gICAgaWhyOiAxLFxuICAgIGltbWVkaWF0ZWx5OiAyLFxuICAgIGZpbmFsOiAzLFxuICAgIHRyYW5zaXQ6IDQsXG4gICAgZGlzY2FyZGVkRmluYWw6IDUsXG4gICAgZGlzY2FyZGVkVHJhbnNpdDogNixcbn0pO1xuXG5jb25zdCBvdXRNc2dUeXBlID0gdThlbnVtKCdPdXRNc2dUeXBlJywge1xuICAgIGV4dGVybmFsOiAwLFxuICAgIGltbWVkaWF0ZWx5OiAxLFxuICAgIG91dE1zZ05ldzogMixcbiAgICB0cmFuc2l0OiAzLFxuICAgIGRlcXVldWVJbW1lZGlhdGVseTogNCxcbiAgICBkZXF1ZXVlOiA1LFxuICAgIHRyYW5zaXRSZXF1aXJlZDogNixcbiAgICBkZXF1ZXVlU2hvcnQ6IDcsXG4gICAgbm9uZTogLTEsXG59KTtcblxuY29uc3Qgc3BsaXRUeXBlID0gdThlbnVtKCdTcGxpdFR5cGUnLCB7XG4gICAgbm9uZTogMCxcbiAgICBzcGxpdDogMixcbiAgICBtZXJnZTogMyxcbn0pO1xuXG5jb25zdCBBY2NvdW50OiBUeXBlRGVmID0ge1xuICAgIF9kb2M6IGRvY3MuYWNjb3VudC5fZG9jLFxuICAgIF86IHsgY29sbGVjdGlvbjogJ2FjY291bnRzJyB9LFxuICAgIHdvcmtjaGFpbl9pZDogaTMyKGRvY3MuYWNjb3VudC53b3JrY2hhaW5faWQpLFxuICAgIGFjY190eXBlOiByZXF1aXJlZChhY2NvdW50VHlwZShkb2NzLmFjY291bnQuYWNjX3R5cGUpKSxcbiAgICBsYXN0X3BhaWQ6IHJlcXVpcmVkKHUzMihkb2NzLmFjY291bnQubGFzdF9wYWlkKSksXG4gICAgZHVlX3BheW1lbnQ6IGdyYW1zKGRvY3MuYWNjb3VudC5kdWVfcGF5bWVudCksXG4gICAgbGFzdF90cmFuc19sdDogcmVxdWlyZWQodTY0KGRvY3MuYWNjb3VudC5sYXN0X3RyYW5zX2x0KSksIC8vIGluZGV4XG4gICAgYmFsYW5jZTogcmVxdWlyZWQoZ3JhbXMoZG9jcy5hY2NvdW50LmJhbGFuY2UpKSwgLy8gaW5kZXhcbiAgICBiYWxhbmNlX290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbihkb2NzLmFjY291bnQuYmFsYW5jZV9vdGhlciksXG4gICAgc3BsaXRfZGVwdGg6IHU4KGRvY3MuYWNjb3VudC5zcGxpdF9kZXB0aCksXG4gICAgdGljazogYm9vbChkb2NzLmFjY291bnQudGljayksXG4gICAgdG9jazogYm9vbChkb2NzLmFjY291bnQudG9jayksXG4gICAgY29kZTogc3RyaW5nKGRvY3MuYWNjb3VudC5jb2RlKSxcbiAgICBjb2RlX2hhc2g6IHN0cmluZyhkb2NzLmFjY291bnQuY29kZV9oYXNoKSxcbiAgICBkYXRhOiBzdHJpbmcoZG9jcy5hY2NvdW50LmRhdGEpLFxuICAgIGRhdGFfaGFzaDogc3RyaW5nKGRvY3MuYWNjb3VudC5kYXRhX2hhc2gpLFxuICAgIGxpYnJhcnk6IHN0cmluZyhkb2NzLmFjY291bnQubGlicmFyeSksXG4gICAgbGlicmFyeV9oYXNoOiBzdHJpbmcoZG9jcy5hY2NvdW50LmxpYnJhcnlfaGFzaCksXG4gICAgcHJvb2Y6IHN0cmluZyhkb2NzLmFjY291bnQucHJvb2YpLFxuICAgIGJvYzogc3RyaW5nKGRvY3MuYWNjb3VudC5ib2MpLFxufTtcblxuY29uc3QgTWVzc2FnZTogVHlwZURlZiA9IHtcbiAgICBfZG9jOiBkb2NzLm1lc3NhZ2UuX2RvYyxcbiAgICBfOiB7IGNvbGxlY3Rpb246ICdtZXNzYWdlcycgfSxcbiAgICBtc2dfdHlwZTogcmVxdWlyZWQobWVzc2FnZVR5cGUoZG9jcy5tZXNzYWdlLm1zZ190eXBlKSksXG4gICAgc3RhdHVzOiByZXF1aXJlZChtZXNzYWdlUHJvY2Vzc2luZ1N0YXR1cyhkb2NzLm1lc3NhZ2Uuc3RhdHVzKSksXG4gICAgYmxvY2tfaWQ6IHJlcXVpcmVkKHN0cmluZyhkb2NzLm1lc3NhZ2UuYmxvY2tfaWQpKSxcbiAgICBibG9jazogam9pbignQmxvY2snLCAnYmxvY2tfaWQnLCAnaWQnKSxcbiAgICBib2R5OiBzdHJpbmcoZG9jcy5tZXNzYWdlLmJvZHkpLFxuICAgIGJvZHlfaGFzaDogc3RyaW5nKGRvY3MubWVzc2FnZS5ib2R5X2hhc2gpLFxuICAgIHNwbGl0X2RlcHRoOiB1OChkb2NzLm1lc3NhZ2Uuc3BsaXRfZGVwdGgpLFxuICAgIHRpY2s6IGJvb2woZG9jcy5tZXNzYWdlLnRpY2spLFxuICAgIHRvY2s6IGJvb2woZG9jcy5tZXNzYWdlLnRvY2spLFxuICAgIGNvZGU6IHN0cmluZyhkb2NzLm1lc3NhZ2UuY29kZSksXG4gICAgY29kZV9oYXNoOiBzdHJpbmcoZG9jcy5tZXNzYWdlLmNvZGVfaGFzaCksXG4gICAgZGF0YTogc3RyaW5nKGRvY3MubWVzc2FnZS5kYXRhKSxcbiAgICBkYXRhX2hhc2g6IHN0cmluZyhkb2NzLm1lc3NhZ2UuZGF0YV9oYXNoKSxcbiAgICBsaWJyYXJ5OiBzdHJpbmcoZG9jcy5tZXNzYWdlLmxpYnJhcnkpLFxuICAgIGxpYnJhcnlfaGFzaDogc3RyaW5nKGRvY3MubWVzc2FnZS5saWJyYXJ5X2hhc2gpLFxuICAgIHNyYzogc3RyaW5nKGRvY3MubWVzc2FnZS5zcmMpLFxuICAgIGRzdDogc3RyaW5nKGRvY3MubWVzc2FnZS5kc3QpLFxuICAgIHNyY193b3JrY2hhaW5faWQ6IGkzMihkb2NzLm1lc3NhZ2Uuc3JjX3dvcmtjaGFpbl9pZCksXG4gICAgZHN0X3dvcmtjaGFpbl9pZDogaTMyKGRvY3MubWVzc2FnZS5kc3Rfd29ya2NoYWluX2lkKSxcbiAgICBjcmVhdGVkX2x0OiB1NjQoZG9jcy5tZXNzYWdlLmNyZWF0ZWRfbHQpLFxuICAgIGNyZWF0ZWRfYXQ6IHVuaXhUaW1lKGRvY3MubWVzc2FnZS5jcmVhdGVkX2F0KSxcbiAgICBpaHJfZGlzYWJsZWQ6IGJvb2woZG9jcy5tZXNzYWdlLmlocl9kaXNhYmxlZCksXG4gICAgaWhyX2ZlZTogZ3JhbXMoZG9jcy5tZXNzYWdlLmlocl9mZWUpLFxuICAgIGZ3ZF9mZWU6IGdyYW1zKGRvY3MubWVzc2FnZS5md2RfZmVlKSxcbiAgICBpbXBvcnRfZmVlOiBncmFtcyhkb2NzLm1lc3NhZ2UuaW1wb3J0X2ZlZSksXG4gICAgYm91bmNlOiBib29sKGRvY3MubWVzc2FnZS5ib3VuY2UpLFxuICAgIGJvdW5jZWQ6IGJvb2woZG9jcy5tZXNzYWdlLmJvdW5jZWQpLFxuICAgIHZhbHVlOiBncmFtcyhkb2NzLm1lc3NhZ2UudmFsdWUpLFxuICAgIHZhbHVlX290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbihkb2NzLm1lc3NhZ2UudmFsdWVfb3RoZXIpLFxuICAgIHByb29mOiBzdHJpbmcoZG9jcy5tZXNzYWdlLnByb29mKSxcbiAgICBib2M6IHN0cmluZyhkb2NzLm1lc3NhZ2UuYm9jKSxcbiAgICBzcmNfdHJhbnNhY3Rpb246IGpvaW4oJ1RyYW5zYWN0aW9uJywgJ2lkJywgJ291dF9tc2dzWypdJywgJ3BhcmVudC5jcmVhdGVkX2x0ICE9PSBcXCcwMFxcJyAmJiBwYXJlbnQubXNnX3R5cGUgIT09IDEnKSxcbiAgICBkc3RfdHJhbnNhY3Rpb246IGpvaW4oJ1RyYW5zYWN0aW9uJywgJ2lkJywgJ2luX21zZycsICdwYXJlbnQubXNnX3R5cGUgIT09IDInKSxcbn07XG5cblxuY29uc3QgVHJhbnNhY3Rpb246IFR5cGVEZWYgPSB7XG4gICAgX2RvYzogZG9jcy50cmFuc2FjdGlvbi5fZG9jLFxuICAgIF86IHsgY29sbGVjdGlvbjogJ3RyYW5zYWN0aW9ucycgfSxcbiAgICB0cl90eXBlOiByZXF1aXJlZCh0cmFuc2FjdGlvblR5cGUoZG9jcy50cmFuc2FjdGlvbi50cl90eXBlKSksXG4gICAgc3RhdHVzOiByZXF1aXJlZCh0cmFuc2FjdGlvblByb2Nlc3NpbmdTdGF0dXMoZG9jcy50cmFuc2FjdGlvbi5zdGF0dXMpKSxcbiAgICBibG9ja19pZDogc3RyaW5nKGRvY3MudHJhbnNhY3Rpb24uYmxvY2tfaWQpLFxuICAgIGJsb2NrOiBqb2luKCdCbG9jaycsICdibG9ja19pZCcsICdpZCcpLFxuICAgIGFjY291bnRfYWRkcjogc3RyaW5nKGRvY3MudHJhbnNhY3Rpb24uYWNjb3VudF9hZGRyKSxcbiAgICB3b3JrY2hhaW5faWQ6IGkzMihkb2NzLnRyYW5zYWN0aW9uLndvcmtjaGFpbl9pZCksXG4gICAgbHQ6IHU2NChkb2NzLnRyYW5zYWN0aW9uLmx0KSxcbiAgICBwcmV2X3RyYW5zX2hhc2g6IHN0cmluZyhkb2NzLnRyYW5zYWN0aW9uLnByZXZfdHJhbnNfaGFzaCksXG4gICAgcHJldl90cmFuc19sdDogdTY0KGRvY3MudHJhbnNhY3Rpb24ucHJldl90cmFuc19sdCksXG4gICAgbm93OiB1MzIoZG9jcy50cmFuc2FjdGlvbi5ub3cpLFxuICAgIG91dG1zZ19jbnQ6IGkzMihkb2NzLnRyYW5zYWN0aW9uLm91dG1zZ19jbnQpLFxuICAgIG9yaWdfc3RhdHVzOiBhY2NvdW50U3RhdHVzKGRvY3MudHJhbnNhY3Rpb24ub3JpZ19zdGF0dXMpLFxuICAgIGVuZF9zdGF0dXM6IGFjY291bnRTdGF0dXMoZG9jcy50cmFuc2FjdGlvbi5lbmRfc3RhdHVzKSxcbiAgICBpbl9tc2c6IHN0cmluZyhkb2NzLnRyYW5zYWN0aW9uLmluX21zZyksXG4gICAgaW5fbWVzc2FnZTogam9pbih7IE1lc3NhZ2UgfSwgJ2luX21zZycsICdpZCcpLFxuICAgIG91dF9tc2dzOiBhcnJheU9mKHN0cmluZyhkb2NzLnRyYW5zYWN0aW9uLm91dF9tc2dzKSksXG4gICAgb3V0X21lc3NhZ2VzOiBhcnJheU9mKGpvaW4oeyBNZXNzYWdlIH0sICdvdXRfbXNncycsICdpZCcpKSxcbiAgICB0b3RhbF9mZWVzOiBncmFtcyhkb2NzLnRyYW5zYWN0aW9uLnRvdGFsX2ZlZXMpLFxuICAgIHRvdGFsX2ZlZXNfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKGRvY3MudHJhbnNhY3Rpb24udG90YWxfZmVlc19vdGhlciksXG4gICAgb2xkX2hhc2g6IHN0cmluZyhkb2NzLnRyYW5zYWN0aW9uLm9sZF9oYXNoKSxcbiAgICBuZXdfaGFzaDogc3RyaW5nKGRvY3MudHJhbnNhY3Rpb24ubmV3X2hhc2gpLFxuICAgIGNyZWRpdF9maXJzdDogYm9vbChkb2NzLnRyYW5zYWN0aW9uLmNyZWRpdF9maXJzdCksXG4gICAgc3RvcmFnZToge1xuICAgICAgICBzdG9yYWdlX2ZlZXNfY29sbGVjdGVkOiBncmFtcyhkb2NzLnRyYW5zYWN0aW9uLnN0b3JhZ2Uuc3RvcmFnZV9mZWVzX2NvbGxlY3RlZCksXG4gICAgICAgIHN0b3JhZ2VfZmVlc19kdWU6IGdyYW1zKGRvY3MudHJhbnNhY3Rpb24uc3RvcmFnZS5zdG9yYWdlX2ZlZXNfZHVlKSxcbiAgICAgICAgc3RhdHVzX2NoYW5nZTogYWNjb3VudFN0YXR1c0NoYW5nZShkb2NzLnRyYW5zYWN0aW9uLnN0b3JhZ2Uuc3RhdHVzX2NoYW5nZSksXG4gICAgfSxcbiAgICBjcmVkaXQ6IHtcbiAgICAgICAgZHVlX2ZlZXNfY29sbGVjdGVkOiBncmFtcyhkb2NzLnRyYW5zYWN0aW9uLmNyZWRpdC5kdWVfZmVlc19jb2xsZWN0ZWQpLFxuICAgICAgICBjcmVkaXQ6IGdyYW1zKGRvY3MudHJhbnNhY3Rpb24uY3JlZGl0LmNyZWRpdCksXG4gICAgICAgIGNyZWRpdF9vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oZG9jcy50cmFuc2FjdGlvbi5jcmVkaXQuY3JlZGl0X290aGVyKSxcbiAgICB9LFxuICAgIGNvbXB1dGU6IHtcbiAgICAgICAgY29tcHV0ZV90eXBlOiByZXF1aXJlZChjb21wdXRlVHlwZShkb2NzLnRyYW5zYWN0aW9uLmNvbXB1dGUuY29tcHV0ZV90eXBlKSksXG4gICAgICAgIHNraXBwZWRfcmVhc29uOiBza2lwUmVhc29uKGRvY3MudHJhbnNhY3Rpb24uY29tcHV0ZS5za2lwcGVkX3JlYXNvbiksXG4gICAgICAgIHN1Y2Nlc3M6IGJvb2woZG9jcy50cmFuc2FjdGlvbi5jb21wdXRlLnN1Y2Nlc3MpLFxuICAgICAgICBtc2dfc3RhdGVfdXNlZDogYm9vbChkb2NzLnRyYW5zYWN0aW9uLmNvbXB1dGUubXNnX3N0YXRlX3VzZWQpLFxuICAgICAgICBhY2NvdW50X2FjdGl2YXRlZDogYm9vbChkb2NzLnRyYW5zYWN0aW9uLmNvbXB1dGUuYWNjb3VudF9hY3RpdmF0ZWQpLFxuICAgICAgICBnYXNfZmVlczogZ3JhbXMoZG9jcy50cmFuc2FjdGlvbi5jb21wdXRlLmdhc19mZWVzKSxcbiAgICAgICAgZ2FzX3VzZWQ6IHU2NChkb2NzLnRyYW5zYWN0aW9uLmNvbXB1dGUuZ2FzX3VzZWQpLFxuICAgICAgICBnYXNfbGltaXQ6IHU2NChkb2NzLnRyYW5zYWN0aW9uLmNvbXB1dGUuZ2FzX2xpbWl0KSxcbiAgICAgICAgZ2FzX2NyZWRpdDogaTMyKGRvY3MudHJhbnNhY3Rpb24uY29tcHV0ZS5nYXNfY3JlZGl0KSxcbiAgICAgICAgbW9kZTogaTgoZG9jcy50cmFuc2FjdGlvbi5jb21wdXRlLm1vZGUpLFxuICAgICAgICBleGl0X2NvZGU6IGkzMihkb2NzLnRyYW5zYWN0aW9uLmNvbXB1dGUuZXhpdF9jb2RlKSxcbiAgICAgICAgZXhpdF9hcmc6IGkzMihkb2NzLnRyYW5zYWN0aW9uLmNvbXB1dGUuZXhpdF9hcmcpLFxuICAgICAgICB2bV9zdGVwczogdTMyKGRvY3MudHJhbnNhY3Rpb24uY29tcHV0ZS52bV9zdGVwcyksXG4gICAgICAgIHZtX2luaXRfc3RhdGVfaGFzaDogc3RyaW5nKGRvY3MudHJhbnNhY3Rpb24uY29tcHV0ZS52bV9pbml0X3N0YXRlX2hhc2gpLFxuICAgICAgICB2bV9maW5hbF9zdGF0ZV9oYXNoOiBzdHJpbmcoZG9jcy50cmFuc2FjdGlvbi5jb21wdXRlLnZtX2ZpbmFsX3N0YXRlX2hhc2gpLFxuICAgIH0sXG4gICAgYWN0aW9uOiB7XG4gICAgICAgIHN1Y2Nlc3M6IGJvb2woZG9jcy50cmFuc2FjdGlvbi5hY3Rpb24uc3VjY2VzcyksXG4gICAgICAgIHZhbGlkOiBib29sKGRvY3MudHJhbnNhY3Rpb24uYWN0aW9uLnZhbGlkKSxcbiAgICAgICAgbm9fZnVuZHM6IGJvb2woZG9jcy50cmFuc2FjdGlvbi5hY3Rpb24ubm9fZnVuZHMpLFxuICAgICAgICBzdGF0dXNfY2hhbmdlOiBhY2NvdW50U3RhdHVzQ2hhbmdlKGRvY3MudHJhbnNhY3Rpb24uYWN0aW9uLnN0YXR1c19jaGFuZ2UpLFxuICAgICAgICB0b3RhbF9md2RfZmVlczogZ3JhbXMoZG9jcy50cmFuc2FjdGlvbi5hY3Rpb24udG90YWxfZndkX2ZlZXMpLFxuICAgICAgICB0b3RhbF9hY3Rpb25fZmVlczogZ3JhbXMoZG9jcy50cmFuc2FjdGlvbi5hY3Rpb24udG90YWxfYWN0aW9uX2ZlZXMpLFxuICAgICAgICByZXN1bHRfY29kZTogaTMyKGRvY3MudHJhbnNhY3Rpb24uYWN0aW9uLnJlc3VsdF9jb2RlKSxcbiAgICAgICAgcmVzdWx0X2FyZzogaTMyKGRvY3MudHJhbnNhY3Rpb24uYWN0aW9uLnJlc3VsdF9hcmcpLFxuICAgICAgICB0b3RfYWN0aW9uczogaTMyKGRvY3MudHJhbnNhY3Rpb24uYWN0aW9uLnRvdF9hY3Rpb25zKSxcbiAgICAgICAgc3BlY19hY3Rpb25zOiBpMzIoZG9jcy50cmFuc2FjdGlvbi5hY3Rpb24uc3BlY19hY3Rpb25zKSxcbiAgICAgICAgc2tpcHBlZF9hY3Rpb25zOiBpMzIoZG9jcy50cmFuc2FjdGlvbi5hY3Rpb24uc2tpcHBlZF9hY3Rpb25zKSxcbiAgICAgICAgbXNnc19jcmVhdGVkOiBpMzIoZG9jcy50cmFuc2FjdGlvbi5hY3Rpb24ubXNnc19jcmVhdGVkKSxcbiAgICAgICAgYWN0aW9uX2xpc3RfaGFzaDogc3RyaW5nKGRvY3MudHJhbnNhY3Rpb24uYWN0aW9uLmFjdGlvbl9saXN0X2hhc2gpLFxuICAgICAgICB0b3RhbF9tc2dfc2l6ZV9jZWxsczogdTMyKGRvY3MudHJhbnNhY3Rpb24uYWN0aW9uLnRvdGFsX21zZ19zaXplX2NlbGxzKSxcbiAgICAgICAgdG90YWxfbXNnX3NpemVfYml0czogdTMyKGRvY3MudHJhbnNhY3Rpb24uYWN0aW9uLnRvdGFsX21zZ19zaXplX2JpdHMpLFxuICAgIH0sXG4gICAgYm91bmNlOiB7XG4gICAgICAgIGJvdW5jZV90eXBlOiByZXF1aXJlZChib3VuY2VUeXBlKGRvY3MudHJhbnNhY3Rpb24uYm91bmNlLmJvdW5jZV90eXBlKSksXG4gICAgICAgIG1zZ19zaXplX2NlbGxzOiB1MzIoZG9jcy50cmFuc2FjdGlvbi5ib3VuY2UubXNnX3NpemVfY2VsbHMpLFxuICAgICAgICBtc2dfc2l6ZV9iaXRzOiB1MzIoZG9jcy50cmFuc2FjdGlvbi5ib3VuY2UubXNnX3NpemVfYml0cyksXG4gICAgICAgIHJlcV9md2RfZmVlczogZ3JhbXMoZG9jcy50cmFuc2FjdGlvbi5ib3VuY2UucmVxX2Z3ZF9mZWVzKSxcbiAgICAgICAgbXNnX2ZlZXM6IGdyYW1zKGRvY3MudHJhbnNhY3Rpb24uYm91bmNlLm1zZ19mZWVzKSxcbiAgICAgICAgZndkX2ZlZXM6IGdyYW1zKGRvY3MudHJhbnNhY3Rpb24uYm91bmNlLmZ3ZF9mZWVzKSxcbiAgICB9LFxuICAgIGFib3J0ZWQ6IGJvb2woZG9jcy50cmFuc2FjdGlvbi5hYm9ydGVkKSxcbiAgICBkZXN0cm95ZWQ6IGJvb2woZG9jcy50cmFuc2FjdGlvbi5kZXN0cm95ZWQpLFxuICAgIHR0OiBzdHJpbmcoZG9jcy50cmFuc2FjdGlvbi50dCksXG4gICAgc3BsaXRfaW5mbzoge1xuICAgICAgICBjdXJfc2hhcmRfcGZ4X2xlbjogdTgoZG9jcy50cmFuc2FjdGlvbi5zcGxpdF9pbmZvLmN1cl9zaGFyZF9wZnhfbGVuKSxcbiAgICAgICAgYWNjX3NwbGl0X2RlcHRoOiB1OChkb2NzLnRyYW5zYWN0aW9uLnNwbGl0X2luZm8uYWNjX3NwbGl0X2RlcHRoKSxcbiAgICAgICAgdGhpc19hZGRyOiBzdHJpbmcoZG9jcy50cmFuc2FjdGlvbi5zcGxpdF9pbmZvLnRoaXNfYWRkciksXG4gICAgICAgIHNpYmxpbmdfYWRkcjogc3RyaW5nKGRvY3MudHJhbnNhY3Rpb24uc3BsaXRfaW5mby5zaWJsaW5nX2FkZHIpLFxuICAgIH0sXG4gICAgcHJlcGFyZV90cmFuc2FjdGlvbjogc3RyaW5nKGRvY3MudHJhbnNhY3Rpb24ucHJlcGFyZV90cmFuc2FjdGlvbiksXG4gICAgaW5zdGFsbGVkOiBib29sKGRvY3MudHJhbnNhY3Rpb24uaW5zdGFsbGVkKSxcbiAgICBwcm9vZjogc3RyaW5nKGRvY3MudHJhbnNhY3Rpb24ucHJvb2YpLFxuICAgIGJvYzogc3RyaW5nKGRvY3MudHJhbnNhY3Rpb24uYm9jKSxcbn07XG5cbi8vIEJMT0NLIFNJR05BVFVSRVNcblxuY29uc3QgQmxvY2tTaWduYXR1cmVzOiBUeXBlRGVmID0ge1xuICAgIF9kb2M6IGRvY3MuYmxvY2tTaWduYXR1cmVzLl9kb2MsXG4gICAgXzogeyBjb2xsZWN0aW9uOiAnYmxvY2tzX3NpZ25hdHVyZXMnIH0sXG4gICAgZ2VuX3V0aW1lOiB1bml4VGltZShkb2NzLmJsb2NrU2lnbmF0dXJlcy5nZW5fdXRpbWUpLFxuICAgIHNlcV9ubzogdTMyKGRvY3MuYmxvY2tTaWduYXR1cmVzLnNlcV9ubyksXG4gICAgc2hhcmQ6IHN0cmluZyhkb2NzLmJsb2NrU2lnbmF0dXJlcy5zaGFyZCksXG4gICAgd29ya2NoYWluX2lkOiBpMzIoZG9jcy5ibG9ja1NpZ25hdHVyZXMud29ya2NoYWluX2lkKSxcbiAgICBwcm9vZjogc3RyaW5nKGRvY3MuYmxvY2tTaWduYXR1cmVzLnByb29mKSxcbiAgICB2YWxpZGF0b3JfbGlzdF9oYXNoX3Nob3J0OiB1MzIoZG9jcy5ibG9ja1NpZ25hdHVyZXMudmFsaWRhdG9yX2xpc3RfaGFzaF9zaG9ydCksXG4gICAgY2F0Y2hhaW5fc2Vxbm86IHUzMihkb2NzLmJsb2NrU2lnbmF0dXJlcy5jYXRjaGFpbl9zZXFubyksXG4gICAgc2lnX3dlaWdodDogdTY0KGRvY3MuYmxvY2tTaWduYXR1cmVzLnNpZ193ZWlnaHQpLFxuICAgIHNpZ25hdHVyZXM6IGFycmF5T2Yoe1xuICAgICAgICBub2RlX2lkOiBzdHJpbmcoKSxcbiAgICAgICAgcjogc3RyaW5nKGRvY3MuYmxvY2tTaWduYXR1cmVzLnNpZ25hdHVyZXMuciksXG4gICAgICAgIHM6IHN0cmluZyhkb2NzLmJsb2NrU2lnbmF0dXJlcy5zaWduYXR1cmVzLnMpLFxuICAgIH0sIGRvY3MuYmxvY2tTaWduYXR1cmVzLnNpZ25hdHVyZXMuX2RvYyksXG4gICAgYmxvY2s6IGpvaW4oJ0Jsb2NrJywgJ2lkJywgJ2lkJyksXG59O1xuXG4vLyBCTE9DS1xuXG5jb25zdCBFeHRCbGtSZWY6IFR5cGVEZWYgPSB7XG4gICAgZW5kX2x0OiB1NjQoKSxcbiAgICBzZXFfbm86IHUzMigpLFxuICAgIHJvb3RfaGFzaDogc3RyaW5nKCksXG4gICAgZmlsZV9oYXNoOiBzdHJpbmcoKVxufTtcblxuY29uc3QgZXh0QmxrUmVmID0gKGRvYz86IHN0cmluZykgPT4gcmVmKHsgRXh0QmxrUmVmIH0sIGRvYyk7XG5cbmNvbnN0IE1zZ0VudmVsb3BlOiBUeXBlRGVmID0ge1xuICAgIG1zZ19pZDogc3RyaW5nKCksXG4gICAgbmV4dF9hZGRyOiBzdHJpbmcoKSxcbiAgICBjdXJfYWRkcjogc3RyaW5nKCksXG4gICAgZndkX2ZlZV9yZW1haW5pbmc6IGdyYW1zKCksXG59O1xuXG5jb25zdCBtc2dFbnZlbG9wZSA9ICgpID0+IHJlZih7IE1zZ0VudmVsb3BlIH0pO1xuXG5jb25zdCBJbk1zZzogVHlwZURlZiA9IHtcbiAgICBtc2dfdHlwZTogcmVxdWlyZWQoaW5Nc2dUeXBlKCkpLFxuICAgIG1zZ19pZDogc3RyaW5nKCksXG4gICAgaWhyX2ZlZTogZ3JhbXMoKSxcbiAgICBwcm9vZl9jcmVhdGVkOiBzdHJpbmcoKSxcbiAgICBpbl9tc2c6IG1zZ0VudmVsb3BlKCksXG4gICAgZndkX2ZlZTogZ3JhbXMoKSxcbiAgICBvdXRfbXNnOiBtc2dFbnZlbG9wZSgpLFxuICAgIHRyYW5zaXRfZmVlOiBncmFtcygpLFxuICAgIHRyYW5zYWN0aW9uX2lkOiBzdHJpbmcoKSxcbiAgICBwcm9vZl9kZWxpdmVyZWQ6IHN0cmluZygpXG59O1xuXG5jb25zdCBpbk1zZyA9IChkb2M/OiBzdHJpbmcpID0+IHJlZih7IEluTXNnIH0sIGRvYyk7XG5cbmNvbnN0IE91dE1zZzogVHlwZURlZiA9IHtcbiAgICBtc2dfdHlwZTogcmVxdWlyZWQob3V0TXNnVHlwZSgpKSxcbiAgICBtc2dfaWQ6IHN0cmluZygpLFxuICAgIHRyYW5zYWN0aW9uX2lkOiBzdHJpbmcoKSxcbiAgICBvdXRfbXNnOiBtc2dFbnZlbG9wZSgpLFxuICAgIHJlaW1wb3J0OiBpbk1zZygpLFxuICAgIGltcG9ydGVkOiBpbk1zZygpLFxuICAgIGltcG9ydF9ibG9ja19sdDogdTY0KCksXG4gICAgbXNnX2Vudl9oYXNoOiBzdHJpbmcoKSxcbiAgICBuZXh0X3dvcmtjaGFpbjogaTMyKCksXG4gICAgbmV4dF9hZGRyX3BmeDogdTY0KCksXG59O1xuXG5jb25zdCBvdXRNc2cgPSAoZG9jPzogc3RyaW5nKSA9PiByZWYoeyBPdXRNc2cgfSwgZG9jKTtcblxuY29uc3Qgc2hhcmREZXNjciA9IChkb2M/OiBzdHJpbmcpOiBUeXBlRGVmID0+IHdpdGhEb2Moe1xuICAgIHNlcV9ubzogdTMyKGRvY3Muc2hhcmREZXNjci5zZXFfbm8pLFxuICAgIHJlZ19tY19zZXFubzogdTMyKGRvY3Muc2hhcmREZXNjci5yZWdfbWNfc2Vxbm8pLFxuICAgIHN0YXJ0X2x0OiB1NjQoZG9jcy5zaGFyZERlc2NyLnN0YXJ0X2x0KSxcbiAgICBlbmRfbHQ6IHU2NChkb2NzLnNoYXJkRGVzY3IuZW5kX2x0KSxcbiAgICByb290X2hhc2g6IHN0cmluZyhkb2NzLnNoYXJkRGVzY3Iucm9vdF9oYXNoKSxcbiAgICBmaWxlX2hhc2g6IHN0cmluZyhkb2NzLnNoYXJkRGVzY3IuZmlsZV9oYXNoKSxcbiAgICBiZWZvcmVfc3BsaXQ6IGJvb2woZG9jcy5zaGFyZERlc2NyLmJlZm9yZV9zcGxpdCksXG4gICAgYmVmb3JlX21lcmdlOiBib29sKGRvY3Muc2hhcmREZXNjci5iZWZvcmVfbWVyZ2UpLFxuICAgIHdhbnRfc3BsaXQ6IGJvb2woZG9jcy5zaGFyZERlc2NyLndhbnRfc3BsaXQpLFxuICAgIHdhbnRfbWVyZ2U6IGJvb2woZG9jcy5zaGFyZERlc2NyLndhbnRfbWVyZ2UpLFxuICAgIG54X2NjX3VwZGF0ZWQ6IGJvb2woZG9jcy5zaGFyZERlc2NyLm54X2NjX3VwZGF0ZWQpLFxuICAgIGZsYWdzOiB1OChkb2NzLnNoYXJkRGVzY3IuZmxhZ3MpLFxuICAgIG5leHRfY2F0Y2hhaW5fc2Vxbm86IHUzMihkb2NzLnNoYXJkRGVzY3IubmV4dF9jYXRjaGFpbl9zZXFubyksXG4gICAgbmV4dF92YWxpZGF0b3Jfc2hhcmQ6IHN0cmluZyhkb2NzLnNoYXJkRGVzY3IubmV4dF92YWxpZGF0b3Jfc2hhcmQpLFxuICAgIG1pbl9yZWZfbWNfc2Vxbm86IHUzMihkb2NzLnNoYXJkRGVzY3IubWluX3JlZl9tY19zZXFubyksXG4gICAgZ2VuX3V0aW1lOiB1bml4VGltZShkb2NzLnNoYXJkRGVzY3IuZ2VuX3V0aW1lKSxcbiAgICBzcGxpdF90eXBlOiBzcGxpdFR5cGUoZG9jcy5zaGFyZERlc2NyLnNwbGl0X3R5cGUpLFxuICAgIHNwbGl0OiB1MzIoZG9jcy5zaGFyZERlc2NyLnNwbGl0KSxcbiAgICBmZWVzX2NvbGxlY3RlZDogZ3JhbXMoZG9jcy5zaGFyZERlc2NyLmZlZXNfY29sbGVjdGVkKSxcbiAgICBmZWVzX2NvbGxlY3RlZF9vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oZG9jcy5zaGFyZERlc2NyLmZlZXNfY29sbGVjdGVkX290aGVyKSxcbiAgICBmdW5kc19jcmVhdGVkOiBncmFtcyhkb2NzLnNoYXJkRGVzY3IuZnVuZHNfY3JlYXRlZCksXG4gICAgZnVuZHNfY3JlYXRlZF9vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oZG9jcy5zaGFyZERlc2NyLmZ1bmRzX2NyZWF0ZWRfb3RoZXIpLFxufSwgZG9jKTtcblxuY29uc3QgR2FzTGltaXRzUHJpY2VzOiBUeXBlRGVmID0ge1xuICAgIGdhc19wcmljZTogdTY0KCksXG4gICAgZ2FzX2xpbWl0OiB1NjQoKSxcbiAgICBzcGVjaWFsX2dhc19saW1pdDogdTY0KCksXG4gICAgZ2FzX2NyZWRpdDogdTY0KCksXG4gICAgYmxvY2tfZ2FzX2xpbWl0OiB1NjQoKSxcbiAgICBmcmVlemVfZHVlX2xpbWl0OiB1NjQoKSxcbiAgICBkZWxldGVfZHVlX2xpbWl0OiB1NjQoKSxcbiAgICBmbGF0X2dhc19saW1pdDogdTY0KCksXG4gICAgZmxhdF9nYXNfcHJpY2U6IHU2NCgpLFxufTtcblxuY29uc3QgZ2FzTGltaXRzUHJpY2VzID0gKGRvYz86IHN0cmluZykgPT4gcmVmKHsgR2FzTGltaXRzUHJpY2VzIH0sIGRvYyk7XG5cbmNvbnN0IEJsb2NrTGltaXRzOiBUeXBlRGVmID0ge1xuICAgIGJ5dGVzOiB7XG4gICAgICAgIHVuZGVybG9hZDogdTMyKCksXG4gICAgICAgIHNvZnRfbGltaXQ6IHUzMigpLFxuICAgICAgICBoYXJkX2xpbWl0OiB1MzIoKSxcbiAgICB9LFxuICAgIGdhczoge1xuICAgICAgICB1bmRlcmxvYWQ6IHUzMigpLFxuICAgICAgICBzb2Z0X2xpbWl0OiB1MzIoKSxcbiAgICAgICAgaGFyZF9saW1pdDogdTMyKCksXG4gICAgfSxcbiAgICBsdF9kZWx0YToge1xuICAgICAgICB1bmRlcmxvYWQ6IHUzMigpLFxuICAgICAgICBzb2Z0X2xpbWl0OiB1MzIoKSxcbiAgICAgICAgaGFyZF9saW1pdDogdTMyKCksXG4gICAgfSxcbn07XG5cbmNvbnN0IGJsb2NrTGltaXRzID0gKGRvYz86IHN0cmluZykgPT4gcmVmKHsgQmxvY2tMaW1pdHMgfSwgZG9jKTtcblxuY29uc3QgTXNnRm9yd2FyZFByaWNlczogVHlwZURlZiA9IHtcbiAgICBsdW1wX3ByaWNlOiB1NjQoKSxcbiAgICBiaXRfcHJpY2U6IHU2NCgpLFxuICAgIGNlbGxfcHJpY2U6IHU2NCgpLFxuICAgIGlocl9wcmljZV9mYWN0b3I6IHUzMigpLFxuICAgIGZpcnN0X2ZyYWM6IHUxNigpLFxuICAgIG5leHRfZnJhYzogdTE2KCksXG59O1xuXG5jb25zdCBtc2dGb3J3YXJkUHJpY2VzID0gKGRvYz86IHN0cmluZykgPT4gcmVmKHsgTXNnRm9yd2FyZFByaWNlcyB9LCBkb2MpO1xuXG5jb25zdCBWYWxpZGF0b3JTZXQ6IFR5cGVEZWYgPSB7XG4gICAgdXRpbWVfc2luY2U6IHVuaXhUaW1lKCksXG4gICAgdXRpbWVfdW50aWw6IHVuaXhUaW1lKCksXG4gICAgdG90YWw6IHUxNigpLFxuICAgIHRvdGFsX3dlaWdodDogdTY0KCksXG4gICAgbGlzdDogYXJyYXlPZih7XG4gICAgICAgIHB1YmxpY19rZXk6IHN0cmluZygpLFxuICAgICAgICB3ZWlnaHQ6IHU2NCgpLFxuICAgICAgICBhZG5sX2FkZHI6IHN0cmluZygpLFxuICAgIH0pLFxufTtcblxuY29uc3QgdmFsaWRhdG9yU2V0ID0gKGRvYz86IHN0cmluZykgPT4gcmVmKHsgVmFsaWRhdG9yU2V0IH0sIGRvYyk7XG5cbmNvbnN0IENvbmZpZ1Byb3Bvc2FsU2V0dXA6IFR5cGVEZWYgPSB7XG4gICAgbWluX3RvdF9yb3VuZHM6IHU4KCksXG4gICAgbWF4X3RvdF9yb3VuZHM6IHU4KCksXG4gICAgbWluX3dpbnM6IHU4KCksXG4gICAgbWF4X2xvc3NlczogdTgoKSxcbiAgICBtaW5fc3RvcmVfc2VjOiB1MzIoKSxcbiAgICBtYXhfc3RvcmVfc2VjOiB1MzIoKSxcbiAgICBiaXRfcHJpY2U6IHUzMigpLFxuICAgIGNlbGxfcHJpY2U6IHUzMigpLFxufTtcblxuY29uc3QgY29uZmlnUHJvcG9zYWxTZXR1cCA9IChkb2M/OiBzdHJpbmcpID0+IHJlZih7IENvbmZpZ1Byb3Bvc2FsU2V0dXAgfSwgZG9jKTtcblxuY29uc3QgQmxvY2s6IFR5cGVEZWYgPSB7XG4gICAgX2RvYzogZG9jcy5ibG9jay5fZG9jLFxuICAgIF86IHsgY29sbGVjdGlvbjogJ2Jsb2NrcycgfSxcbiAgICBzdGF0dXM6IGJsb2NrUHJvY2Vzc2luZ1N0YXR1cyhkb2NzLmJsb2NrLnN0YXR1cyksXG4gICAgZ2xvYmFsX2lkOiB1MzIoZG9jcy5ibG9jay5nbG9iYWxfaWQpLFxuICAgIHdhbnRfc3BsaXQ6IGJvb2woZG9jcy5ibG9jay53YW50X3NwbGl0KSxcbiAgICBzZXFfbm86IHUzMihkb2NzLmJsb2NrLnNlcV9ubyksXG4gICAgYWZ0ZXJfbWVyZ2U6IGJvb2woZG9jcy5ibG9jay5hZnRlcl9tZXJnZSksXG4gICAgZ2VuX3V0aW1lOiB1bml4VGltZShkb2NzLmJsb2NrLmdlbl91dGltZSksXG4gICAgZ2VuX2NhdGNoYWluX3NlcW5vOiB1MzIoZG9jcy5ibG9jay5nZW5fY2F0Y2hhaW5fc2Vxbm8pLFxuICAgIGZsYWdzOiB1MTYoZG9jcy5ibG9jay5mbGFncyksXG4gICAgbWFzdGVyX3JlZjogZXh0QmxrUmVmKGRvY3MuYmxvY2subWFzdGVyX3JlZiksXG4gICAgcHJldl9yZWY6IGV4dEJsa1JlZihkb2NzLmJsb2NrLnByZXZfcmVmKSxcbiAgICBwcmV2X2FsdF9yZWY6IGV4dEJsa1JlZihkb2NzLmJsb2NrLnByZXZfYWx0X3JlZiksXG4gICAgcHJldl92ZXJ0X3JlZjogZXh0QmxrUmVmKGRvY3MuYmxvY2sucHJldl92ZXJ0X3JlZiksXG4gICAgcHJldl92ZXJ0X2FsdF9yZWY6IGV4dEJsa1JlZihkb2NzLmJsb2NrLnByZXZfdmVydF9hbHRfcmVmKSxcbiAgICB2ZXJzaW9uOiB1MzIoZG9jcy5ibG9jay52ZXJzaW9uKSxcbiAgICBnZW5fdmFsaWRhdG9yX2xpc3RfaGFzaF9zaG9ydDogdTMyKGRvY3MuYmxvY2suZ2VuX3ZhbGlkYXRvcl9saXN0X2hhc2hfc2hvcnQpLFxuICAgIGJlZm9yZV9zcGxpdDogYm9vbChkb2NzLmJsb2NrLmJlZm9yZV9zcGxpdCksXG4gICAgYWZ0ZXJfc3BsaXQ6IGJvb2woZG9jcy5ibG9jay5hZnRlcl9zcGxpdCksXG4gICAgd2FudF9tZXJnZTogYm9vbChkb2NzLmJsb2NrLndhbnRfbWVyZ2UpLFxuICAgIHZlcnRfc2VxX25vOiB1MzIoZG9jcy5ibG9jay52ZXJ0X3NlcV9ubyksXG4gICAgc3RhcnRfbHQ6IHU2NChkb2NzLmJsb2NrLnN0YXJ0X2x0KSxcbiAgICBlbmRfbHQ6IHU2NChkb2NzLmJsb2NrLmVuZF9sdCksXG4gICAgd29ya2NoYWluX2lkOiBpMzIoZG9jcy5ibG9jay53b3JrY2hhaW5faWQpLFxuICAgIHNoYXJkOiBzdHJpbmcoZG9jcy5ibG9jay5zaGFyZCksXG4gICAgbWluX3JlZl9tY19zZXFubzogdTMyKGRvY3MuYmxvY2subWluX3JlZl9tY19zZXFubyksXG4gICAgcHJldl9rZXlfYmxvY2tfc2Vxbm86IHUzMihkb2NzLmJsb2NrLnByZXZfa2V5X2Jsb2NrX3NlcW5vKSxcbiAgICBnZW5fc29mdHdhcmVfdmVyc2lvbjogdTMyKGRvY3MuYmxvY2suZ2VuX3NvZnR3YXJlX3ZlcnNpb24pLFxuICAgIGdlbl9zb2Z0d2FyZV9jYXBhYmlsaXRpZXM6IHN0cmluZyhkb2NzLmJsb2NrLmdlbl9zb2Z0d2FyZV9jYXBhYmlsaXRpZXMpLFxuICAgIHZhbHVlX2Zsb3c6IHtcbiAgICAgICAgdG9fbmV4dF9ibGs6IGdyYW1zKGRvY3MuYmxvY2sudmFsdWVfZmxvdy50b19uZXh0X2JsayksXG4gICAgICAgIHRvX25leHRfYmxrX290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbihkb2NzLmJsb2NrLnZhbHVlX2Zsb3cudG9fbmV4dF9ibGtfb3RoZXIpLFxuICAgICAgICBleHBvcnRlZDogZ3JhbXMoZG9jcy5ibG9jay52YWx1ZV9mbG93LmV4cG9ydGVkKSxcbiAgICAgICAgZXhwb3J0ZWRfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKGRvY3MuYmxvY2sudmFsdWVfZmxvdy5leHBvcnRlZF9vdGhlciksXG4gICAgICAgIGZlZXNfY29sbGVjdGVkOiBncmFtcyhkb2NzLmJsb2NrLnZhbHVlX2Zsb3cuZmVlc19jb2xsZWN0ZWQpLFxuICAgICAgICBmZWVzX2NvbGxlY3RlZF9vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oZG9jcy5ibG9jay52YWx1ZV9mbG93LmZlZXNfY29sbGVjdGVkX290aGVyKSxcbiAgICAgICAgY3JlYXRlZDogZ3JhbXMoZG9jcy5ibG9jay52YWx1ZV9mbG93LmNyZWF0ZWQpLFxuICAgICAgICBjcmVhdGVkX290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbihkb2NzLmJsb2NrLnZhbHVlX2Zsb3cuY3JlYXRlZF9vdGhlciksXG4gICAgICAgIGltcG9ydGVkOiBncmFtcyhkb2NzLmJsb2NrLnZhbHVlX2Zsb3cuaW1wb3J0ZWQpLFxuICAgICAgICBpbXBvcnRlZF9vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oZG9jcy5ibG9jay52YWx1ZV9mbG93LmltcG9ydGVkX290aGVyKSxcbiAgICAgICAgZnJvbV9wcmV2X2JsazogZ3JhbXMoZG9jcy5ibG9jay52YWx1ZV9mbG93LmZyb21fcHJldl9ibGspLFxuICAgICAgICBmcm9tX3ByZXZfYmxrX290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbihkb2NzLmJsb2NrLnZhbHVlX2Zsb3cuZnJvbV9wcmV2X2Jsa19vdGhlciksXG4gICAgICAgIG1pbnRlZDogZ3JhbXMoZG9jcy5ibG9jay52YWx1ZV9mbG93Lm1pbnRlZCksXG4gICAgICAgIG1pbnRlZF9vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oZG9jcy5ibG9jay52YWx1ZV9mbG93Lm1pbnRlZF9vdGhlciksXG4gICAgICAgIGZlZXNfaW1wb3J0ZWQ6IGdyYW1zKGRvY3MuYmxvY2sudmFsdWVfZmxvdy5mZWVzX2ltcG9ydGVkKSxcbiAgICAgICAgZmVlc19pbXBvcnRlZF9vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oZG9jcy5ibG9jay52YWx1ZV9mbG93LmZlZXNfaW1wb3J0ZWRfb3RoZXIpLFxuICAgIH0sXG4gICAgaW5fbXNnX2Rlc2NyOiBhcnJheU9mKGluTXNnKGRvY3MuYmxvY2suaW5fbXNnX2Rlc2NyKSksXG4gICAgcmFuZF9zZWVkOiBzdHJpbmcoZG9jcy5ibG9jay5yYW5kX3NlZWQpLFxuICAgIG91dF9tc2dfZGVzY3I6IGFycmF5T2Yob3V0TXNnKGRvY3MuYmxvY2sub3V0X21zZ19kZXNjcikpLFxuICAgIGFjY291bnRfYmxvY2tzOiBhcnJheU9mKHtcbiAgICAgICAgYWNjb3VudF9hZGRyOiBzdHJpbmcoZG9jcy5ibG9jay5hY2NvdW50X2Jsb2Nrcy5hY2NvdW50X2FkZHIpLFxuICAgICAgICB0cmFuc2FjdGlvbnM6IGFycmF5T2Yoe1xuICAgICAgICAgICAgICAgIGx0OiB1NjQoKSwgLy8gVE9ETzogZG9jXG4gICAgICAgICAgICAgICAgdHJhbnNhY3Rpb25faWQ6IHN0cmluZygpLCAvLyBUT0RPOiBkb2NcbiAgICAgICAgICAgICAgICB0b3RhbF9mZWVzOiBncmFtcygpLCAvLyBUT0RPOiBkb2NcbiAgICAgICAgICAgICAgICB0b3RhbF9mZWVzX290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbigpLCAvLyBUT0RPOiBkb2NcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBkb2NzLmJsb2NrLmFjY291bnRfYmxvY2tzLnRyYW5zYWN0aW9uc1xuICAgICAgICApLFxuICAgICAgICBvbGRfaGFzaDogc3RyaW5nKGRvY3MuYmxvY2suYWNjb3VudF9ibG9ja3Muc3RhdGVfdXBkYXRlLm9sZF9oYXNoKSxcbiAgICAgICAgbmV3X2hhc2g6IHN0cmluZyhkb2NzLmJsb2NrLmFjY291bnRfYmxvY2tzLnN0YXRlX3VwZGF0ZS5uZXdfaGFzaCksXG4gICAgICAgIHRyX2NvdW50OiBpMzIoZG9jcy5ibG9jay5hY2NvdW50X2Jsb2Nrcy50cl9jb3VudClcbiAgICB9KSxcbiAgICB0cl9jb3VudDogaTMyKCksIC8vIFRPRE86IGRvY1xuICAgIHN0YXRlX3VwZGF0ZToge1xuICAgICAgICBuZXc6IHN0cmluZyhkb2NzLmJsb2NrLnN0YXRlX3VwZGF0ZS5uZXcpLFxuICAgICAgICBuZXdfaGFzaDogc3RyaW5nKGRvY3MuYmxvY2suc3RhdGVfdXBkYXRlLm5ld19oYXNoKSxcbiAgICAgICAgbmV3X2RlcHRoOiB1MTYoZG9jcy5ibG9jay5zdGF0ZV91cGRhdGUubmV3X2RlcHRoKSxcbiAgICAgICAgb2xkOiBzdHJpbmcoZG9jcy5ibG9jay5zdGF0ZV91cGRhdGUub2xkKSxcbiAgICAgICAgb2xkX2hhc2g6IHN0cmluZyhkb2NzLmJsb2NrLnN0YXRlX3VwZGF0ZS5vbGRfaGFzaCksXG4gICAgICAgIG9sZF9kZXB0aDogdTE2KGRvY3MuYmxvY2suc3RhdGVfdXBkYXRlLm9sZF9kZXB0aClcbiAgICB9LFxuICAgIG1hc3Rlcjoge1xuICAgICAgICBtaW5fc2hhcmRfZ2VuX3V0aW1lOiB1bml4VGltZShkb2NzLmJsb2NrLm1hc3Rlci5taW5fc2hhcmRfZ2VuX3V0aW1lKSxcbiAgICAgICAgbWF4X3NoYXJkX2dlbl91dGltZTogdW5peFRpbWUoZG9jcy5ibG9jay5tYXN0ZXIubWF4X3NoYXJkX2dlbl91dGltZSksXG4gICAgICAgIHNoYXJkX2hhc2hlczogYXJyYXlPZih7XG4gICAgICAgICAgICB3b3JrY2hhaW5faWQ6IGkzMihkb2NzLmJsb2NrLm1hc3Rlci5zaGFyZF9oYXNoZXMud29ya2NoYWluX2lkKSxcbiAgICAgICAgICAgIHNoYXJkOiBzdHJpbmcoZG9jcy5ibG9jay5tYXN0ZXIuc2hhcmRfaGFzaGVzLnNoYXJkKSxcbiAgICAgICAgICAgIGRlc2NyOiBzaGFyZERlc2NyKGRvY3MuYmxvY2subWFzdGVyLnNoYXJkX2hhc2hlcy5kZXNjciksXG4gICAgICAgIH0pLFxuICAgICAgICBzaGFyZF9mZWVzOiBhcnJheU9mKHtcbiAgICAgICAgICAgIHdvcmtjaGFpbl9pZDogaTMyKGRvY3MuYmxvY2subWFzdGVyLnNoYXJkX2ZlZXMud29ya2NoYWluX2lkKSxcbiAgICAgICAgICAgIHNoYXJkOiBzdHJpbmcoZG9jcy5ibG9jay5tYXN0ZXIuc2hhcmRfZmVlcy5zaGFyZCksXG4gICAgICAgICAgICBmZWVzOiBncmFtcyhkb2NzLmJsb2NrLm1hc3Rlci5zaGFyZF9mZWVzLmZlZXMpLFxuICAgICAgICAgICAgZmVlc19vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oZG9jcy5ibG9jay5tYXN0ZXIuc2hhcmRfZmVlcy5mZWVzX290aGVyKSxcbiAgICAgICAgICAgIGNyZWF0ZTogZ3JhbXMoZG9jcy5ibG9jay5tYXN0ZXIuc2hhcmRfZmVlcy5jcmVhdGUpLFxuICAgICAgICAgICAgY3JlYXRlX290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbihkb2NzLmJsb2NrLm1hc3Rlci5zaGFyZF9mZWVzLmNyZWF0ZV9vdGhlciksXG4gICAgICAgIH0pLFxuICAgICAgICByZWNvdmVyX2NyZWF0ZV9tc2c6IGluTXNnKGRvY3MuYmxvY2subWFzdGVyLnJlY292ZXJfY3JlYXRlX21zZyksXG4gICAgICAgIHByZXZfYmxrX3NpZ25hdHVyZXM6IGFycmF5T2Yoe1xuICAgICAgICAgICAgbm9kZV9pZDogc3RyaW5nKGRvY3MuYmxvY2subWFzdGVyLnByZXZfYmxrX3NpZ25hdHVyZXMubm9kZV9pZCksXG4gICAgICAgICAgICByOiBzdHJpbmcoZG9jcy5ibG9jay5tYXN0ZXIucHJldl9ibGtfc2lnbmF0dXJlcy5yKSxcbiAgICAgICAgICAgIHM6IHN0cmluZyhkb2NzLmJsb2NrLm1hc3Rlci5wcmV2X2Jsa19zaWduYXR1cmVzLnMpLFxuICAgICAgICB9KSxcbiAgICAgICAgY29uZmlnX2FkZHI6IHN0cmluZygpLFxuICAgICAgICBjb25maWc6IHtcbiAgICAgICAgICAgIHAwOiBzdHJpbmcoZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAwKSxcbiAgICAgICAgICAgIHAxOiBzdHJpbmcoZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAxKSxcbiAgICAgICAgICAgIHAyOiBzdHJpbmcoZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAyKSxcbiAgICAgICAgICAgIHAzOiBzdHJpbmcoZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAzKSxcbiAgICAgICAgICAgIHA0OiBzdHJpbmcoZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnA0KSxcbiAgICAgICAgICAgIHA2OiB7XG4gICAgICAgICAgICAgICAgX2RvYzogZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnA2Ll9kb2MsXG4gICAgICAgICAgICAgICAgbWludF9uZXdfcHJpY2U6IHN0cmluZygpLFxuICAgICAgICAgICAgICAgIG1pbnRfYWRkX3ByaWNlOiBzdHJpbmcoKSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwNzogYXJyYXlPZih7XG4gICAgICAgICAgICAgICAgY3VycmVuY3k6IHUzMigpLFxuICAgICAgICAgICAgICAgIHZhbHVlOiBzdHJpbmcoKSxcbiAgICAgICAgICAgIH0sIGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wNy5fZG9jKSxcbiAgICAgICAgICAgIHA4OiB7XG4gICAgICAgICAgICAgICAgX2RvYzogZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnA4Ll9kb2MsXG4gICAgICAgICAgICAgICAgdmVyc2lvbjogdTMyKCksXG4gICAgICAgICAgICAgICAgY2FwYWJpbGl0aWVzOiBzdHJpbmcoKSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwOTogYXJyYXlPZih1MzIoKSwgZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnA5Ll9kb2MpLFxuICAgICAgICAgICAgcDEwOiBhcnJheU9mKHUzMigpLCBkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDEwLl9kb2MpLFxuICAgICAgICAgICAgcDExOiB7XG4gICAgICAgICAgICAgICAgX2RvYzogZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAxMS5fZG9jLFxuICAgICAgICAgICAgICAgIG5vcm1hbF9wYXJhbXM6IGNvbmZpZ1Byb3Bvc2FsU2V0dXAoZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAxMS5ub3JtYWxfcGFyYW1zKSxcbiAgICAgICAgICAgICAgICBjcml0aWNhbF9wYXJhbXM6IGNvbmZpZ1Byb3Bvc2FsU2V0dXAoZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAxMS5jcml0aWNhbF9wYXJhbXMpLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHAxMjogYXJyYXlPZih7XG4gICAgICAgICAgICAgICAgd29ya2NoYWluX2lkOiBpMzIoKSxcbiAgICAgICAgICAgICAgICBlbmFibGVkX3NpbmNlOiB1MzIoKSxcbiAgICAgICAgICAgICAgICBhY3R1YWxfbWluX3NwbGl0OiB1OCgpLFxuICAgICAgICAgICAgICAgIG1pbl9zcGxpdDogdTgoKSxcbiAgICAgICAgICAgICAgICBtYXhfc3BsaXQ6IHU4KCksXG4gICAgICAgICAgICAgICAgYWN0aXZlOiBib29sKCksXG4gICAgICAgICAgICAgICAgYWNjZXB0X21zZ3M6IGJvb2woKSxcbiAgICAgICAgICAgICAgICBmbGFnczogdTE2KCksXG4gICAgICAgICAgICAgICAgemVyb3N0YXRlX3Jvb3RfaGFzaDogc3RyaW5nKCksXG4gICAgICAgICAgICAgICAgemVyb3N0YXRlX2ZpbGVfaGFzaDogc3RyaW5nKCksXG4gICAgICAgICAgICAgICAgdmVyc2lvbjogdTMyKCksXG4gICAgICAgICAgICAgICAgYmFzaWM6IGJvb2woKSxcbiAgICAgICAgICAgICAgICB2bV92ZXJzaW9uOiBpMzIoKSxcbiAgICAgICAgICAgICAgICB2bV9tb2RlOiBzdHJpbmcoKSxcbiAgICAgICAgICAgICAgICBtaW5fYWRkcl9sZW46IHUxNigpLFxuICAgICAgICAgICAgICAgIG1heF9hZGRyX2xlbjogdTE2KCksXG4gICAgICAgICAgICAgICAgYWRkcl9sZW5fc3RlcDogdTE2KCksXG4gICAgICAgICAgICAgICAgd29ya2NoYWluX3R5cGVfaWQ6IHUzMigpLFxuICAgICAgICAgICAgfSwgZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAxMi5fZG9jKSxcbiAgICAgICAgICAgIHAxNDoge1xuICAgICAgICAgICAgICAgIF9kb2M6IGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMTQuX2RvYyxcbiAgICAgICAgICAgICAgICBtYXN0ZXJjaGFpbl9ibG9ja19mZWU6IGdyYW1zKCksXG4gICAgICAgICAgICAgICAgYmFzZWNoYWluX2Jsb2NrX2ZlZTogZ3JhbXMoKSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwMTU6IHtcbiAgICAgICAgICAgICAgICBfZG9jOiBkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDE1Ll9kb2MsXG4gICAgICAgICAgICAgICAgdmFsaWRhdG9yc19lbGVjdGVkX2ZvcjogdTMyKCksXG4gICAgICAgICAgICAgICAgZWxlY3Rpb25zX3N0YXJ0X2JlZm9yZTogdTMyKCksXG4gICAgICAgICAgICAgICAgZWxlY3Rpb25zX2VuZF9iZWZvcmU6IHUzMigpLFxuICAgICAgICAgICAgICAgIHN0YWtlX2hlbGRfZm9yOiB1MzIoKSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwMTY6IHtcbiAgICAgICAgICAgICAgICBfZG9jOiBkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDE2Ll9kb2MsXG4gICAgICAgICAgICAgICAgbWF4X3ZhbGlkYXRvcnM6IHUxNigpLFxuICAgICAgICAgICAgICAgIG1heF9tYWluX3ZhbGlkYXRvcnM6IHUxNigpLFxuICAgICAgICAgICAgICAgIG1pbl92YWxpZGF0b3JzOiB1MTYoKSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwMTc6IHtcbiAgICAgICAgICAgICAgICBfZG9jOiBkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDE3Ll9kb2MsXG4gICAgICAgICAgICAgICAgbWluX3N0YWtlOiB1MTI4KCksXG4gICAgICAgICAgICAgICAgbWF4X3N0YWtlOiB1MTI4KCksXG4gICAgICAgICAgICAgICAgbWluX3RvdGFsX3N0YWtlOiB1MTI4KCksXG4gICAgICAgICAgICAgICAgbWF4X3N0YWtlX2ZhY3RvcjogdTMyKClcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwMTg6IGFycmF5T2Yoe1xuICAgICAgICAgICAgICAgIHV0aW1lX3NpbmNlOiB1bml4VGltZSgpLFxuICAgICAgICAgICAgICAgIGJpdF9wcmljZV9wczogdTY0KCksXG4gICAgICAgICAgICAgICAgY2VsbF9wcmljZV9wczogdTY0KCksXG4gICAgICAgICAgICAgICAgbWNfYml0X3ByaWNlX3BzOiB1NjQoKSxcbiAgICAgICAgICAgICAgICBtY19jZWxsX3ByaWNlX3BzOiB1NjQoKSxcbiAgICAgICAgICAgIH0sIGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMTguX2RvYyksXG4gICAgICAgICAgICBwMjA6IGdhc0xpbWl0c1ByaWNlcyhkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDIwKSxcbiAgICAgICAgICAgIHAyMTogZ2FzTGltaXRzUHJpY2VzKGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMjEpLFxuICAgICAgICAgICAgcDIyOiBibG9ja0xpbWl0cyhkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDIyKSxcbiAgICAgICAgICAgIHAyMzogYmxvY2tMaW1pdHMoZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAyMyksXG4gICAgICAgICAgICBwMjQ6IG1zZ0ZvcndhcmRQcmljZXMoZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAyNCksXG4gICAgICAgICAgICBwMjU6IG1zZ0ZvcndhcmRQcmljZXMoZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAyNSksXG4gICAgICAgICAgICBwMjg6IHtcbiAgICAgICAgICAgICAgICBfZG9jOiBkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDI4Ll9kb2MsXG4gICAgICAgICAgICAgICAgc2h1ZmZsZV9tY192YWxpZGF0b3JzOiBib29sKCksXG4gICAgICAgICAgICAgICAgbWNfY2F0Y2hhaW5fbGlmZXRpbWU6IHUzMigpLFxuICAgICAgICAgICAgICAgIHNoYXJkX2NhdGNoYWluX2xpZmV0aW1lOiB1MzIoKSxcbiAgICAgICAgICAgICAgICBzaGFyZF92YWxpZGF0b3JzX2xpZmV0aW1lOiB1MzIoKSxcbiAgICAgICAgICAgICAgICBzaGFyZF92YWxpZGF0b3JzX251bTogdTMyKCksXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcDI5OiB7XG4gICAgICAgICAgICAgICAgX2RvYzogZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAyOS5fZG9jLFxuICAgICAgICAgICAgICAgIG5ld19jYXRjaGFpbl9pZHM6IGJvb2woKSxcbiAgICAgICAgICAgICAgICByb3VuZF9jYW5kaWRhdGVzOiB1MzIoKSxcbiAgICAgICAgICAgICAgICBuZXh0X2NhbmRpZGF0ZV9kZWxheV9tczogdTMyKCksXG4gICAgICAgICAgICAgICAgY29uc2Vuc3VzX3RpbWVvdXRfbXM6IHUzMigpLFxuICAgICAgICAgICAgICAgIGZhc3RfYXR0ZW1wdHM6IHUzMigpLFxuICAgICAgICAgICAgICAgIGF0dGVtcHRfZHVyYXRpb246IHUzMigpLFxuICAgICAgICAgICAgICAgIGNhdGNoYWluX21heF9kZXBzOiB1MzIoKSxcbiAgICAgICAgICAgICAgICBtYXhfYmxvY2tfYnl0ZXM6IHUzMigpLFxuICAgICAgICAgICAgICAgIG1heF9jb2xsYXRlZF9ieXRlczogdTMyKClcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwMzE6IGFycmF5T2Yoc3RyaW5nKCksIGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMzEuX2RvYyksXG4gICAgICAgICAgICBwMzI6IHZhbGlkYXRvclNldChkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDMyKSxcbiAgICAgICAgICAgIHAzMzogdmFsaWRhdG9yU2V0KGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMzMpLFxuICAgICAgICAgICAgcDM0OiB2YWxpZGF0b3JTZXQoZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAzNCksXG4gICAgICAgICAgICBwMzU6IHZhbGlkYXRvclNldChkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDM1KSxcbiAgICAgICAgICAgIHAzNjogdmFsaWRhdG9yU2V0KGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMzYpLFxuICAgICAgICAgICAgcDM3OiB2YWxpZGF0b3JTZXQoZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAzNyksXG4gICAgICAgICAgICBwMzk6IGFycmF5T2Yoe1xuICAgICAgICAgICAgICAgIGFkbmxfYWRkcjogc3RyaW5nKCksXG4gICAgICAgICAgICAgICAgdGVtcF9wdWJsaWNfa2V5OiBzdHJpbmcoKSxcbiAgICAgICAgICAgICAgICBzZXFubzogdTMyKCksXG4gICAgICAgICAgICAgICAgdmFsaWRfdW50aWw6IHUzMigpLFxuICAgICAgICAgICAgICAgIHNpZ25hdHVyZV9yOiBzdHJpbmcoKSxcbiAgICAgICAgICAgICAgICBzaWduYXR1cmVfczogc3RyaW5nKCksXG4gICAgICAgICAgICB9LCBkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDM5Ll9kb2MpLFxuICAgICAgICB9XG4gICAgfSxcbiAgICBrZXlfYmxvY2s6IGJvb2woZG9jcy5ibG9jay5rZXlfYmxvY2spLFxuICAgIGJvYzogc3RyaW5nKGRvY3MuYmxvY2suYm9jKSxcbiAgICBzaWduYXR1cmVzOiBqb2luKHsgQmxvY2tTaWduYXR1cmVzIH0sICdpZCcsICdpZCcpLFxufTtcblxuLy9Sb290IHNjaGVtZSBkZWNsYXJhdGlvblxuXG5jb25zdCBzY2hlbWE6IFR5cGVEZWYgPSB7XG4gICAgX2NsYXNzOiB7XG4gICAgICAgIHR5cGVzOiB7XG4gICAgICAgICAgICBPdGhlckN1cnJlbmN5LFxuICAgICAgICAgICAgRXh0QmxrUmVmLFxuICAgICAgICAgICAgTXNnRW52ZWxvcGUsXG4gICAgICAgICAgICBJbk1zZyxcbiAgICAgICAgICAgIE91dE1zZyxcbiAgICAgICAgICAgIE1lc3NhZ2UsXG4gICAgICAgICAgICBCbG9jayxcbiAgICAgICAgICAgIEFjY291bnQsXG4gICAgICAgICAgICBUcmFuc2FjdGlvbixcbiAgICAgICAgICAgIEJsb2NrU2lnbmF0dXJlcyxcbiAgICAgICAgICAgIEdhc0xpbWl0c1ByaWNlcyxcbiAgICAgICAgICAgIEJsb2NrTGltaXRzLFxuICAgICAgICAgICAgTXNnRm9yd2FyZFByaWNlcyxcbiAgICAgICAgICAgIFZhbGlkYXRvclNldCxcbiAgICAgICAgICAgIENvbmZpZ1Byb3Bvc2FsU2V0dXBcbiAgICAgICAgfVxuICAgIH1cbn07XG5cbmV4cG9ydCBkZWZhdWx0IHNjaGVtYTtcbiJdfQ==