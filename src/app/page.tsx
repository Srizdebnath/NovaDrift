import WalletConnect from "@/components/WalletConnect";
import Crowdfunding from "@/components/Crowdfunding";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#0B0C10] p-4 relative overflow-hidden">
      {/* Subtle Background Effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-radial-[at_top] from-cyan-900/20 via-transparent to-transparent opacity-80 pointer-events-none"></div>

      <div className="z-10 text-center mb-12">
        <h1 className="text-6xl font-light text-white tracking-tighter mb-3">
          NOVA<span className="font-semibold text-cyan-400">DRIFT</span>
        </h1>
        <p className="text-gray-400 font-light tracking-wide text-sm uppercase opacity-70">
          Stellar Payment Interface
        </p>
      </div>

      <div className="z-10 w-full max-w-7xl grid grid-cols-1 md:grid-cols-2 gap-8 items-start justify-center">
        <WalletConnect />
        <Crowdfunding />
      </div>
    </main>
  );
}