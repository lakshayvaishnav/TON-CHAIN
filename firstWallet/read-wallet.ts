import { mnemonicToWalletKey } from "@ton/crypto";
import { getHttpEndpoint } from "@orbs-network/ton-access";
import { WalletContractV4, TonClient, fromNano } from "@ton/ton";
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  // open the wallet.

  const mnemonic = process.env.mnemonic!;

  const key = await mnemonicToWalletKey(mnemonic.split(" "));
  const wallet = WalletContractV4.create({
    publicKey: key.publicKey,
    workchain: 0,
  });

  // initilaizing the rpc client on testnet.
  const endpoint = await getHttpEndpoint({ network: "testnet" });
  const client = new TonClient({ endpoint });

  // query balance from chain..
  const balance = await client.getBalance(wallet.address);
  console.log("balance : ", fromNano(balance));

  // query seqno from chain.
  const walletcontract = client.open(wallet);
  const seqno = await walletcontract.getSeqno();
  console.log("seqno : ", seqno);
}

main();
