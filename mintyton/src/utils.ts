import { KeyPair, mnemonicToPrivateKey } from "ton-crypto";
import {
  beginCell,
  Cell,
  OpenedContract,
  TonClient,
  WalletContractV4,
} from "ton";

export type OpenedWallet = {
  contract: OpenedContract<WalletContractV4>;
  keyPair: KeyPair;
};

export async function openWallet(mnemonic: string[], testnet: boolean) {
  const keyPair = await mnemonicToPrivateKey(mnemonic);

  // interact with ton center
  const toncenterBaseEndpoint: string = testnet
    ? "https://testnet.toncenter.com"
    : "https://toncenter.com";

  // create a client using rpc of ton
  const client = new TonClient({
    endpoint: `${toncenterBaseEndpoint}/api/v2/jsonRPC`,
    apiKey: process.env.TONCENTER_API_KEY,
  });

  // opens the wallet
  const wallet = WalletContractV4.create({
    workchain: 0,
    publicKey: keyPair.publicKey,
  });

  const contract = client.open(wallet);
  return { contract, keyPair };
}
