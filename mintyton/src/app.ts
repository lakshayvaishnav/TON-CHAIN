import { GetGemsSaleData, NftSale } from "./../contracts/NftSale";
import { NftMarketplace } from "./../contracts/NftMarketplace";
import { NftItem } from "./../contracts/NftItems";
import { NftCollection } from "./../contracts/NftCollection";
import * as dotenv from "dotenv";
import { updateMetadataFiles, uploadFolderToIPFS } from "./metadata";

import { openWallet } from "./utils";
import { readdir } from "fs/promises";
import { beginCell, toNano } from "ton-core";
import { waitSeqno } from "./delay";

import axios from "axios";
import axiosRetry from "axios-retry";
dotenv.config();

// Configure axios to retry on failure
axiosRetry(axios, { retries: 3, retryDelay: axiosRetry.exponentialDelay });

async function init() {
  const metadataFolderPath = "./src/data/metadata";
  const imagesFolderPath = "./src/data/images";

  // function to open the wallet...
  const wallet = await openWallet(process.env.MNEMONIC!.split(" "), true);

  console.log("Started uploading images to IPFS...");
  const imagesIpfsHash = await uploadFolderToIPFS(imagesFolderPath);
  console.log(`images ipfs hash ${imagesIpfsHash}`);
  console.log(
    `Successfully uploaded the pictures to ipfs: https://gateway.pinata.cloud/ipfs/${imagesIpfsHash}`
  );

  // const imagesIpfsHash = "QmZC8CYs2UuRrUSxQ29thhsQHVErajr1ZBz4WXFYeZnKqk";

  console.log("Started uploading metadata files to IPFS...");
  await updateMetadataFiles(metadataFolderPath, imagesIpfsHash);
  const metadataIpfsHash = await uploadFolderToIPFS(metadataFolderPath);
  console.log(`metadata ipfs hash ${metadataIpfsHash}`);
  console.log(
    `Successfully uploaded the metadata to ipfs: https://gateway.pinata.cloud/ipfs/${metadataIpfsHash}`
  );

  // const metadataIpfsHash = "Qmaa2jNzvazmjjtrM7bHKSkejZXwHauSW8AHkZNwyp1Vox";

  console.log("Start deploy of nft collection...");
  const collectionData = {
    ownerAddress: wallet.contract.address,
    royaltyPercent: 0.05, // 0.05 = 5%
    royaltyAddress: wallet.contract.address,
    nextItemIndex: 0,
    collectionContentUrl: `ipfs://${metadataIpfsHash}/collection.json`,
    commonContentUrl: `ipfs://${metadataIpfsHash}/`,
  };
  const collection = new NftCollection(collectionData);
  let seqno = await collection.deploy(wallet);
  console.log(`Collection deployed: ${collection.address}`);
  await waitSeqno(seqno, wallet);

  const files = await readdir(metadataFolderPath);
  files.pop();
  let index = 0;

  seqno = await collection.topUpBalance(wallet, files.length);
  await waitSeqno(seqno, wallet);
  console.log(`Balance top-upped`);

  for (const file of files) {
    console.log(`Start deploy of ${index + 1} NFT`);
    const mintParams = {
      queryId: 0,
      itemOwnerAddress: wallet.contract.address,
      itemIndex: index,
      amount: toNano("0.05"),
      commonContentUrl: file,
    };

    const nftItem = new NftItem(collection);
    seqno = await nftItem.deploy(wallet, mintParams);
    console.log(`Successfully deployed ${index + 1} NFT`);
    await waitSeqno(seqno, wallet);
    index++;
  }

  console.log("Start deploy of new marketplace  ");
  const marketplace = new NftMarketplace(wallet.contract.address);
  seqno = await marketplace.deploy(wallet);
  await waitSeqno(seqno, wallet);
  console.log("Successfully deployed new marketplace");

  const nftToSaleAddress = await NftItem.getAddressByIndex(
    collection.address,
    0
  );

  const saleData: GetGemsSaleData = {
    isComplete: false,
    createdAt: Math.ceil(Date.now() / 1000),
    marketplaceAddress: marketplace.address,
    nftAddress: nftToSaleAddress,
    nftOwnerAddress: null,
    fullPrice: toNano("10"),
    marketplaceFeeAddress: wallet.contract.address,
    marketplaceFee: toNano("1"),
    royaltyAddress: wallet.contract.address,
    royaltyAmount: toNano("0.5"),
  };

  const nftSaleContract = new NftSale(saleData);
  seqno = await nftSaleContract.deploy(wallet);
  await waitSeqno(seqno, wallet);

  await NftItem.transfer(wallet, nftToSaleAddress, nftSaleContract.address);
}

void init();
