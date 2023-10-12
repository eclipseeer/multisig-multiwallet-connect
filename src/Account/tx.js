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
const pk = PublicKey.from('ed25519:EU3JT4N2ahWEzVPfcjEutG89ZDfX1vcqeYz9N1DDest6');
console.log(pk);

export const tx = async (provider) => {
  const accessKey = await provider.query(`access_key/${sender}/${pk.toString()}`, '');
  const nonce = accessKey.nonce + 1;

  console.log(accessKey);

  const recentBlockHash = utils.serialize.base_decode(accessKey.block_hash);

  const a = transactions.createTransaction(
    sender,
    pk,
    'eclpseeer-multisig-test-2.testnet',
    nonce,
    [transactions.transfer(utils.format.parseNearAmount('0.01'))],
    recentBlockHash,
  );
  console.log(a);
  return a;
};
