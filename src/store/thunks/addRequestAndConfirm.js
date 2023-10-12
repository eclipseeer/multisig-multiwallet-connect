import { transactions, utils, providers } from 'near-api-js';
import { PublicKey } from 'near-api-js/lib/utils';
import { thunk } from 'easy-peasy';
import { requestSignTransactions } from '../wallets/myNearWallet/helpers/requestSignTransactions.js';
import { LedgerSigner } from '../wallets/ledger/helpers/LedgerSigner.ts';
/*
 * export function createTransaction(
 * signerId: string,
 * publicKey: PublicKey,
 * receiverId: string,
 * nonce: BN | string | number,
 * actions: Action[],
 * blockHash: Uint8Array): Transaction
 * */
// const sender = 'eclpseeer-multisig-test-1.testnet';
// const receiver = 'eclpseeer-multisig-test-1.testnet';
// const pk = PublicKey.from('ed25519:D4AP2sdR9FQbvu3wcXYfQ9NAyUshir64uaRAhCAPRgyq');

const createTx = async (provider, sender, receiver, publicKey) => {
  const pk = PublicKey.from(publicKey);
  const accessKey = await provider.query(`access_key/${sender}/${pk.toString()}`, '');
  const nonce = accessKey.nonce + 1;
  const recentBlockHash = utils.serialize.base_decode(accessKey.block_hash);

  const tx = transactions.createTransaction(
    sender,
    pk,
    receiver,
    nonce,
    [
      transactions.functionCall(
        'add_request_and_confirm',
        {
          request: {
            receiver_id: 'eclipseer.testnet',
            actions: [{ type: 'Transfer', amount: utils.format.parseNearAmount('0.01') }],
          },
        },
        300000000000000,
        0,
      ),
    ],
    recentBlockHash,
  );
  console.log(tx);
  return tx;
};

// ledger requestSignAndSentTransaction
const requestSignAndSentTransaction = async (tx) => {
  const provider = new providers.JsonRpcProvider(`https://rpc.testnet.near.org`);

  const [_hash, signature] = await transactions.signTransaction(
    tx,
    new LedgerSigner(),
    tx.signerId,
    'testnet',
  );

  const signedSerializedTx = signature.encode();

  // sends transaction to NEAR blockchain via JSON RPC call and records the result
  const result = await provider.sendJsonRpc('broadcast_tx_commit', [
    Buffer.from(signedSerializedTx).toString('base64'),
  ]);
  console.log(result);
};



export const addRequestAndConfirm = thunk(async (actions, payload, { getStoreState }) => {
  const state = getStoreState();
  const account = state.selectedAccount;

  if (account.wallet === 'myNearWallet') {
    const tx = await createTx(
      state.wallets[account.wallet].connection.connection.provider,
      account.accountId,
      account.accountId,
      account.publicKey,
    );

    requestSignTransactions({
      transactions: [tx],
      walletUrl: state.wallets.myNearWallet.connection.config.walletUrl,
    });
  }

  if (account.wallet === 'ledger') {
    const tx = await createTx(
      state.wallets[account.wallet].connection.provider,
      account.accountId,
      account.accountId,
      account.publicKey,
    );

    await requestSignAndSentTransaction(tx);
  }
});
