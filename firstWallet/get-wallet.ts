import { mnemonicToWalletKey } from "@ton/crypto";
import { WalletContractV4 } from "@ton/ton";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  // open the wallet (make sure the wallet version is correct)
  const mnemonic = process.env.mnemonic!;
  const key = await mnemonicToWalletKey(mnemonic.split(" "));
  const wallet = WalletContractV4.create({
    publicKey: key.publicKey,
    workchain: 0,
  });

  // print the wallet address.
  console.log("wallet address : ", wallet.address.toString());

  // print the wallet's workchain.
  console.log("workchain : ", wallet.address.workChain);
}

main();
