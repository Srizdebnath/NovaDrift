import {
    StellarWalletsKit,
    WalletNetwork,
    allowAllModules,
    FREIGHTER_ID,
    XBULL_ID
} from "@creit.tech/stellar-wallets-kit";
import { Horizon, rpc } from "stellar-sdk";

export const kit = new StellarWalletsKit({
    network: WalletNetwork.TESTNET,
    selectedWalletId: FREIGHTER_ID,
    modules: allowAllModules(),
});


export const server = new Horizon.Server("https://horizon-testnet.stellar.org");
export const rpcServer = new rpc.Server("https://soroban-testnet.stellar.org");
