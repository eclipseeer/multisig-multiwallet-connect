import TransportWebHID from '@ledgerhq/hw-transport-webhid';
import { utils } from 'near-api-js';
import { Buffer } from 'buffer';

// Further reading regarding APDU Ledger API:
// - https://gist.github.com/Wollac/49f0c4e318e42f463b8306298dfb4f4a
// - https://github.com/LedgerHQ/app-near/blob/master/workdir/app-near/src/constants.h

export const CLA = 0x80; // Always the same for Ledger.
export const INS_SIGN = 0x02; // Sign
export const INS_GET_PUBLIC_KEY = 0x04; // Get Public Key
export const INS_GET_APP_VERSION = 0x06; // Get App Version
export const P1_LAST = 0x80; // End of Bytes to Sign (finalize)
export const P1_MORE = 0x00; // More bytes coming
export const P1_IGNORE = 0x00;
export const P2_IGNORE = 0x00;

// Converts BIP32-compliant derivation path to a Buffer.
// More info here: https://github.com/LedgerHQ/ledger-live-common/blob/master/docs/derivation.md
const parseDerivationPath = (derivationPath: string = "44'/397'/0'/0'/1'") => {
  const parts = derivationPath.split('/');

  return Buffer.concat(
    parts
      .map((part) => {
        // @ts-ignore
        return part.endsWith(`'`)
          ? Math.abs(parseInt(part.slice(0, -1))) | 0x80000000
          : Math.abs(parseInt(part));
      })
      .map((i32) => {
        return Buffer.from([(i32 >> 24) & 0xff, (i32 >> 16) & 0xff, (i32 >> 8) & 0xff, i32 & 0xff]);
      }),
  );
};

// TODO: Understand what this is exactly. What's so special about 87?
export const networkId = 'W'.charCodeAt(0);

interface SignParams {
  data: Uint8Array;
  derivationPath?: string;
}
interface EventMap {
  disconnect: Error;
}
export interface Subscription {
  remove: () => void;
}

// Not using TransportWebHID.isSupported as it's chosen to use a Promise...
// @ts-ignore
export const isLedgerSupported = () => !!window.navigator?.hid;

export class LedgerClient {
  // @ts-ignore
  private transport: Transport | null = null;

  isConnected = () => Boolean(this.transport);

  ifNotConnected = () => {
    if (!this.isConnected()) {
      throw new Error('Device already connected');
    }
  }

  // @ts-ignore
  connect = async () => {
    if (this.isConnected()) throw new Error('Device already connected');
    // @ts-ignore
    this.transport = await TransportWebHID.create();

    const handleDisconnect = () => {
      this.transport?.off('disconnect', handleDisconnect);
      this.transport = null;
    };

    this.transport.on('disconnect', handleDisconnect);
  };

  // @ts-ignore
  disconnect = async () => {
    this.ifNotConnected();
    await this.transport.close();
    this.transport = null;
  };

  on = <Event extends keyof EventMap>(
    event: Event,
    callback: (data: EventMap[Event]) => void,
  ): Subscription => {
    this.ifNotConnected();
    this.transport.on(event, callback);
    return {
      remove: () => this.transport?.off(event, callback),
    };
  };

  off = (event: keyof EventMap, callback: () => void) => {
    this.ifNotConnected();
    this.transport.off(event, callback);
  };

  getVersion = async () => {
    this.ifNotConnected();
    const res = await this.transport.send(CLA, INS_GET_APP_VERSION, P1_IGNORE, P2_IGNORE);
    //@ts-ignore
    const [major, minor, patch] = Array.from(res);
    return `${major}.${minor}.${patch}`;
  };

  getPublicKey = async (derivationPath?: string) => {
    this.ifNotConnected();

    const res = await this.transport.send(
      CLA,
      INS_GET_PUBLIC_KEY,
      P2_IGNORE,
      networkId,
      parseDerivationPath(derivationPath),
    );

    return utils.PublicKey.from(utils.serialize.base_encode(res.subarray(0, -2)));
  };

  sign = async ({ data, derivationPath }: SignParams) => {
    this.ifNotConnected();
    // NOTE: getVersion call resets state to avoid starting from partially filled buffer
    await this.getVersion();
    // 128 - 5 service bytes
    const CHUNK_SIZE = 123;
    const allData = Buffer.concat([parseDerivationPath(derivationPath), Buffer.from(data)]);

    for (let offset = 0; offset < allData.length; offset += CHUNK_SIZE) {
      const isLastChunk = offset + CHUNK_SIZE >= allData.length;

      const response = await this.transport.send(
        CLA,
        INS_SIGN,
        isLastChunk ? P1_LAST : P1_MORE,
        P2_IGNORE,
        Buffer.from(allData.subarray(offset, offset + CHUNK_SIZE)),
      );

      if (isLastChunk) {
        console.log('end');
        return Buffer.from(response.subarray(0, -2));
      }
    }

    throw new Error('Invalid data or derivation path');
  };
}
