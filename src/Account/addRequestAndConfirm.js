import { transactions, utils } from 'near-api-js';
import { PublicKey } from 'near-api-js/lib/utils';

/*
 * export function createTransaction(
 * signerId: string,
 * publicKey: PublicKey,
 * receiverId: string,
 * nonce: BN | string | number,
 * actions: Action[],
 * blockHash: Uint8Array): Transaction
 * */
const sender = 'eclpseeer-multisig-test-1.testnet';
const receiver = 'eclpseeer-multisig-test-1.testnet';
const pk = PublicKey.from('ed25519:D4AP2sdR9FQbvu3wcXYfQ9NAyUshir64uaRAhCAPRgyq');


export const addRequestAndConfirm = async (provider) => {
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
