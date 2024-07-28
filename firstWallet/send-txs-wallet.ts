import { getHttpEndpoint } from "@orbs-network/ton-access";
import { mnemonicToWalletKey } from "@ton/crypto";
import { TonClient, fromNano, WalletContractV4, internal } from "@ton/ton";
import * as dotenv from "dotenv";
import { sleep } from "./utils/sleep";
dotenv.config();

async function main() {
  // opening the wallet
  const mnemonic = process.env.mnemonic!;
  const key = await mnemonicToWalletKey(mnemonic.split(" "));
  const wallet = WalletContractV4.create({
    publicKey: key.publicKey,
    workchain: 0,
  });

  // initialize the rpc client..
  const endpoint = await getHttpEndpoint({ network: "testnet" });
  const client = new TonClient({ endpoint });

  // making sure wallet is deployed.
  if (!(await client.isContractDeployed(wallet.address))) {
    console.log("wallet is not deployed...");
  }

  // send 0.05 TON to EQA4V9tF4lY2S_J-sEQR7aUj9IwW-Ou2vJQlCn--2DLOLR5e
  const walletcontract = client.open(wallet);
  const seqno = await walletcontract.getSeqno();
  await walletcontract.sendTransfer({
    seqno: seqno,
    secretKey: key.secretKey,
    messages: [
      internal({
        to: "EQA4V9tF4lY2S_J-sEQR7aUj9IwW-Ou2vJQlCn--2DLOLR5e",
        value: "0.05",
        body: "first tsx",
        bounce: false,
      }),
    ],
  });

  // wait till confirmed.
  let currentseqno = seqno;
  while (currentseqno == seqno) {
    console.log("waiting for transaction to be confirmed");
    await sleep(1500);
    currentseqno = await walletcontract.getSeqno();
  }
  console.log("transaction confirmed... 👍🏻");

  console.log("check the wallet for your new nft");
}

main();
