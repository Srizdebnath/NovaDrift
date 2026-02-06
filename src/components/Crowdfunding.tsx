"use client";

import { useState, useEffect } from "react";
import { kit, server, rpcServer } from "../utils/stellar";
import { TransactionBuilder, Networks, Asset, Operation, Contract, Address, scValToNative, nativeToScVal, rpc } from "stellar-sdk";

const CONTRACT_ID = "CB6N6KROTOYLECXYGUBVW6HMWUJYIOLDKLYYRBO4RRAQINS4PMP3SIWI";
const RECIPIENT_ADDRESS = "GCLT3ZVPSKGICZXOF5I5JFLATWGE4BSZCCCLMGC7TO7DJ7IC3U2ZBRUG";

export default function Crowdfunding() {
    const [targetAmount, setTargetAmount] = useState<number>(0);
    const [raisedAmount, setRaisedAmount] = useState<number>(0);
    const [donationAmount, setDonationAmount] = useState<string>("");
    const [status, setStatus] = useState<string>("");
    const [walletAddress, setWalletAddress] = useState<string>("");


    const progress = targetAmount > 0 ? Math.min((raisedAmount / targetAmount) * 100, 100) : 0;

    useEffect(() => {
        checkConnection();
        fetchState();
        const interval = setInterval(fetchState, 10000);
        return () => clearInterval(interval);
    }, []);

    const checkConnection = async () => {
        try {
            const { address } = await kit.getAddress();
            if (address) setWalletAddress(address);
        } catch (e) {
        }
    };

    const fetchState = async () => {
        try {
            const contract = new Contract(CONTRACT_ID);
            const simulationAccount = "GCLT3ZVPSKGICZXOF5I5JFLATWGE4BSZCCCLMGC7TO7DJ7IC3U2ZBRUG";
            const source = walletAddress || simulationAccount;

            const account = await server.loadAccount(source);
            const tx = new TransactionBuilder(account, {
                fee: "100",
                networkPassphrase: Networks.TESTNET,
            })
                .addOperation(
                    contract.call("get_state")
                )
                .setTimeout(30)
                .build();

            const sim = await rpcServer.simulateTransaction(tx);

            if (rpc.Api.isSimulationSuccess(sim) && sim.result) {
                const result = sim.result.retval;
                const values = scValToNative(result);
                if (Array.isArray(values)) {
                    setTargetAmount(Number(values[0]));
                    setRaisedAmount(Number(values[1]));
                }
            }
        } catch (error) {
            console.error("Fetch state error", error);
        }
    };

    const handleDonate = async () => {
        if (!donationAmount || !walletAddress) return;
        setStatus("Preparing transaction...");

        try {
            const sourceAccount = await server.loadAccount(walletAddress);
            const contract = new Contract(CONTRACT_ID);
            setStatus("Process 1/2: Sending Payment...");
            const paymentTx = new TransactionBuilder(sourceAccount, {
                fee: "100",
                networkPassphrase: Networks.TESTNET,
            })
                .addOperation(
                    Operation.payment({
                        destination: RECIPIENT_ADDRESS,
                        asset: Asset.native(),
                        amount: donationAmount
                    })
                )
                .setTimeout(30)
                .build();

            console.log("Signing Payment Tx...");
            console.log("XDR:", paymentTx.toXDR());
            const { signedTxXdr: signedPayment } = await kit.signTransaction(paymentTx.toXDR(), {
                networkPassphrase: Networks.TESTNET,
            });

            const paymentResponse = await rpcServer.sendTransaction(TransactionBuilder.fromXDR(signedPayment, Networks.TESTNET));

            if (paymentResponse.status !== "PENDING") {
                setStatus("Payment Failed: " + paymentResponse.status);
                return;
            }

          
            setStatus("Confirming Payment...");
            await new Promise(r => setTimeout(r, 4000)); 

         
            setStatus("Process 2/2: Recording Donation...");
            const sourceAccount2 = await server.loadAccount(walletAddress); 

            const contractTx = new TransactionBuilder(sourceAccount2, {
                fee: "100",
                networkPassphrase: Networks.TESTNET,
            })
                .addOperation(
                    contract.call("donate",
                        new Address(walletAddress).toScVal(),
                        nativeToScVal(BigInt(Math.floor(Number(donationAmount))), { type: "i128" })
                    )
                )
                .setTimeout(30)
                .build();

            
            const simulation = await rpcServer.simulateTransaction(contractTx);

            if (!rpc.Api.isSimulationSuccess(simulation)) {
                setStatus("Simulation failed");
                console.error("Simulation failed:", JSON.stringify(simulation, null, 2));
                return;
            }

      
            const assembledTx = rpc.assembleTransaction(contractTx, simulation);

            if (!assembledTx) {
                throw new Error("Failed to assemble transaction");
            }

           
            const preparedTx = typeof assembledTx.build === 'function' ? assembledTx.build() : assembledTx;

            
            // @ts-ignore
            const xdrString = typeof preparedTx.toXDR === 'function' ? preparedTx.toXDR() : preparedTx;

            console.log("Signing Contract Tx...");
            console.log("Contract XDR:", xdrString);

            
            const { signedTxXdr: signedContract } = await kit.signTransaction(xdrString, {
                networkPassphrase: Networks.TESTNET,
            });

            const contractResponse = await rpcServer.sendTransaction(TransactionBuilder.fromXDR(signedContract, Networks.TESTNET));

            if (contractResponse.status !== "PENDING") {
                setStatus("Contract Call Failed: " + contractResponse.status);
                return;
            }

            setStatus("Success! Donation Recorded.");
            setDonationAmount("");
            fetchState();

        } catch (error) {
            console.error("Donation Error:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
            setStatus("Failed: " + (error instanceof Error ? error.message : "Unknown error"));
        }
    };

    return (
        <div className="w-full h-full bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl relative overflow-hidden flex flex-col justify-center">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/20 rounded-full blur-3xl pointer-events-none"></div>

            <h2 className="text-2xl font-medium text-white mb-6 tracking-tight">Support the Mission</h2>

            <div className="mb-8">
                <div className="flex justify-between items-end mb-3">
                    <span className="text-4xl font-light text-white">{raisedAmount.toLocaleString()} <span className="text-lg text-gray-400">XLM</span></span>
                    <span className="text-sm text-gray-400 mb-1">Goal: {targetAmount.toLocaleString()} XLM</span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden border border-white/5">
                    <div
                        className="bg-gradient-to-r from-purple-500 to-cyan-500 h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(168,85,247,0.5)]"
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
                <div className="flex justify-between mt-2 text-xs text-gray-500 font-mono">
                    <span>{progress.toFixed(1)}% Funded</span>
                    <span>12 Days Left</span>
                </div>
            </div>

            <div className="space-y-4">
                <div className="relative">
                    <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Donation Amount</label>
                    <input
                        type="number"
                        placeholder="0"
                        className="w-full bg-white/5 text-white p-4 rounded-xl border border-white/10 focus:border-purple-500 outline-none transition-all text-lg font-mono placeholder:text-gray-700"
                        onChange={(e) => setDonationAmount(e.target.value)}
                        value={donationAmount}
                    />
                    <span className="absolute right-4 top-[38px] text-gray-500 pointer-events-none">XLM</span>
                </div>

                <button
                    onClick={handleDonate}
                    disabled={!walletAddress || !donationAmount}
                    className={`w-full py-4 rounded-xl font-medium transition-all shadow-lg active:scale-[0.98] text-sm tracking-wide uppercase ${walletAddress
                        ? 'bg-gradient-to-r from-purple-600 to-cyan-600 text-white hover:shadow-cyan-500/20'
                        : 'bg-white/5 text-gray-500 cursor-not-allowed border border-white/5'
                        }`}
                >
                    {walletAddress ? "Confirm Donation" : "Connect Wallet to Donate"}
                </button>
            </div>

            {status && (
                <div className="mt-6 p-3 rounded-lg bg-black/30 border border-white/10 text-center">
                    <p className="text-xs text-cyan-300 font-mono">{status}</p>
                </div>
            )}
        </div>
    );
}
