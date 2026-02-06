"use client";

import { useState, useEffect } from "react";
import {
    isConnected,
    requestAccess,
    signTransaction,
    setAllowed,
} from "@stellar/freighter-api";
import { Horizon, TransactionBuilder, Networks, Asset, Operation } from "stellar-sdk";


const server = new Horizon.Server("https://horizon-testnet.stellar.org");

interface TxHistory {
    id: string;
    type: string;
    created_at: string;
    amount?: string;
    asset_code?: string;
    from?: string;
    to?: string;
}

export default function WalletConnect() {
    const [walletAddress, setWalletAddress] = useState<string>("");
    const [balance, setBalance] = useState<string>("0");
    const [destination, setDestination] = useState<string>("");
    const [amount, setAmount] = useState<string>("");
    const [txStatus, setTxStatus] = useState<string>("");
    const [txHash, setTxHash] = useState<string>("");
    const [transactions, setTransactions] = useState<TxHistory[]>([]);


    const handleConnect = async () => {
        const installed = await isConnected();
        if (!installed) {
            alert("Please install Freighter Wallet!");
            return;
        }

        try {
            const allowed = await setAllowed();
            if (allowed) {
                const response = await requestAccess();
                if (response.error) {
                    console.error(response.error);
                    return;
                }
                setWalletAddress(response.address);
                fetchBalance(response.address);
                fetchTransactions(response.address);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleDisconnect = () => {
        setWalletAddress("");
        setBalance("0");
        setTxStatus("");
        setTxHash("");
    };


    const fetchBalance = async (publicKey: string) => {
        try {
            const account = await server.loadAccount(publicKey);
            const xlmBalance = account.balances.find(
                (b: any) => b.asset_type === "native"
            );
            if (xlmBalance) {
                setBalance(xlmBalance.balance);
            }
        } catch (error) {
            console.error("Error fetching balance:", error);
        }
    };

    const fetchTransactions = async (publicKey: string) => {
        try {
            const resp = await server.payments().forAccount(publicKey).limit(5).order("desc").call();
            const history = resp.records.map((r: any) => ({
                id: r.id,
                type: r.type,
                created_at: new Date(r.created_at).toLocaleDateString() + " " + new Date(r.created_at).toLocaleTimeString(),
                amount: r.amount,
                asset_code: r.asset_type === "native" ? "XLM" : r.asset_code,
                from: r.from,
                to: r.to,
            }));
            setTransactions(history);
        } catch (error) {
            console.error("Error fetching transactions:", error);
        }
    };


    const sendTransaction = async () => {
        if (!walletAddress || !destination || !amount) return;
        setTxStatus("Processing...");

        try {

            const sourceAccount = await server.loadAccount(walletAddress);
            const tx = new TransactionBuilder(sourceAccount, {
                fee: "100",
                networkPassphrase: Networks.TESTNET,
            })
                .addOperation(
                    Operation.payment({
                        destination: destination,
                        asset: Asset.native(),
                        amount: amount,
                    })
                )
                .setTimeout(30)
                .build();
            const signedTxResponse = await signTransaction(tx.toXDR(), {
                networkPassphrase: Networks.TESTNET,
            });

            if (signedTxResponse.error) {
                throw new Error(signedTxResponse.error);
            }

            const txFromXDR = TransactionBuilder.fromXDR(signedTxResponse.signedTxXdr, Networks.TESTNET);

            const txResult = await server.submitTransaction(txFromXDR);

            setTxStatus("Success!");
            setTxHash(txResult.hash);
            fetchBalance(walletAddress);
            fetchTransactions(walletAddress);
        } catch (error) {
            console.error("Tx failed", error);
            setTxStatus("Failed. Check console.");
        }
    };

    return (
        <div className="w-full max-w-md bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent opacity-50"></div>

            <div className="flex justify-between items-center mb-8">
                <h2 className="text-xl font-medium text-white tracking-wide">
                    Wallet Access
                </h2>
                {!walletAddress ? (
                    <button
                        onClick={handleConnect}
                        className="bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 hover:text-cyan-200 border border-cyan-500/20 px-4 py-2 rounded-lg transition-all duration-200 text-sm font-medium tracking-wide backdrop-blur-sm"
                    >
                        Connect Freighter
                    </button>
                ) : (
                    <button
                        onClick={handleDisconnect}
                        className="text-red-400 hover:text-red-300 text-xs uppercase tracking-wider font-semibold transition-colors"
                    >
                        Disconnect
                    </button>
                )}
            </div>

            {walletAddress && (
                <div className="space-y-8">
                    <div className="bg-white/5 border border-white/5 rounded-xl p-5 backdrop-blur-md">
                        <div className="mb-4">
                            <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Account</p>
                            <p className="text-xs text-white/90 font-mono break-all bg-black/20 p-2 rounded">
                                {walletAddress}
                            </p>
                        </div>
                        <div>
                            <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Available Balance</p>
                            <p className="text-3xl font-light text-white tracking-tight">
                                {balance} <span className="text-sm font-normal text-cyan-400 ml-1">XLM</span>
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-3">
                            <input
                                type="text"
                                placeholder="Destination Address (G...)"
                                className="w-full bg-transparent text-white p-3 border-b border-white/10 focus:border-cyan-500 outline-none transition-colors placeholder:text-gray-600 text-sm font-mono"
                                onChange={(e) => setDestination(e.target.value)}
                            />
                            <div className="relative">
                                <input
                                    type="number"
                                    placeholder="0.00"
                                    className="w-full bg-transparent text-white p-3 border-b border-white/10 focus:border-cyan-500 outline-none transition-colors placeholder:text-gray-600 text-sm font-mono"
                                    onChange={(e) => setAmount(e.target.value)}
                                />
                                <span className="absolute right-3 top-3 text-xs text-gray-500 pointer-events-none">XLM</span>
                            </div>
                        </div>

                        <button
                            onClick={sendTransaction}
                            className="w-full bg-cyan-600 hover:bg-cyan-500 text-white py-3 rounded-lg font-medium transition-all shadow-lg hover:shadow-cyan-500/20 active:scale-[0.98]"
                        >
                            Send Transaction
                        </button>
                    </div>



                    {txStatus && (
                        <div className={`p-4 rounded-lg text-center text-sm ${txStatus === 'Success!' ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' : 'bg-white/5 text-gray-300 border border-white/5'}`}>
                            <p className="font-medium">{txStatus}</p>
                            {txHash && (
                                <a
                                    href={`https://stellar.expert/explorer/testnet/tx/${txHash}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-cyan-400 hover:text-cyan-300 underline mt-2 block"
                                >
                                    View on Explorer
                                </a>
                            )}
                        </div>
                    )}

                    {transactions.length > 0 && (
                        <div className="pt-4 border-t border-white/5">
                            <h3 className="text-white/60 text-xs uppercase tracking-wider mb-4">Recent Activity</h3>
                            <div className="space-y-2">
                                {transactions.map((tx) => (
                                    <div key={tx.id} className="group flex justify-between items-center p-2 rounded hover:bg-white/5 transition-colors">
                                        <div className="flex flex-col">
                                            <span className={`text-sm font-medium ${tx.type === 'payment' && tx.to === walletAddress ? 'text-emerald-400' : 'text-white/80'}`}>
                                                {tx.type === "payment" ? (tx.to === walletAddress ? "Received" : "Sent") : "Transaction"}
                                            </span>
                                            <span className="text-[10px] text-gray-500 font-mono">{tx.created_at}</span>
                                        </div>
                                        {tx.amount && (
                                            <div className="text-right">
                                                <div className="text-sm font-mono text-white">
                                                    {tx.to === walletAddress ? "+" : "-"}{tx.amount}
                                                </div>
                                                <div className="text-[10px] text-gray-600">{tx.asset_code}</div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}