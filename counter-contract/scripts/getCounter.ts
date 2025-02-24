import { getHttpEndpoint } from '@orbs-network/ton-access';
import { TonClient, Address } from '@ton/ton';
import Counter from '../wrappers/Counter'; // this is the interface class we just implemented

export async function run() {
    // initialize ton rpc client on testnet
    const endpoint = await getHttpEndpoint({ network: 'testnet' });
    const client = new TonClient({ endpoint });

    // open Counter instance by address
    const counterAddress = Address.parse('EQAqeboKc_6jq2Y_thjtlMq8Uyrlu03_05gRRTUNtB8hgZB9'); // replace with your address from step 8
    const counter = new Counter(counterAddress);
    const counterContract = client.open(counter);

    // call the getter on chain
    const counterValue = await counterContract.getCounter();
    console.log('value:', counterValue.toString());
}
