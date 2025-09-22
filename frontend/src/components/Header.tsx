"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useSwitchChain } from "wagmi";
import { avalancheFuji } from "wagmi/chains";
import { motion } from "motion/react";

function Header() {
  const pathname = usePathname();
  const { switchChain } = useSwitchChain();

  const navItems = [
    { name: "Home", path: "/" },
    { name: "AI DEX", path: "/ai-dex" },
    // { name: "AI Governance", path: "/ai-governance" },
    { name: "Launchpad", path: "/launchpad" },
    { name: "Magic Links", path: "/magic-links" },
    { name: "Governance", path: "/governance" },
  ];

  const isActive = (path: string) => {
    return pathname === path;
  };

  const handleSwitchToAvalancheFuji = async () => {
    try {
      await switchChain({ chainId: avalancheFuji.id });
    } catch (error) {
      console.error("Failed to switch to Avalanche Fuji:", error);
    }
  };
  return (
    <motion.header
      className="fixed w-full py-10  h-16 z-20 bg-transparent backdrop-blur-2xl flex items-center justify-between px-8  z-50 backdrop-blur-3xl border-b border-white/9 flex items-center justify-between px-8 rounded-full shadow-b-lg"
      initial={{
        opacity: 0,
        y: -40,
        filter: "blur(12px)",
      }}
      animate={{
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
      }}
      transition={{
        duration: 0.8,
        ease: "easeOut",
        delay: 0.1,
      }}
    >
      {/* Logo */}
      <motion.div
        className="flex items-center"
        initial={{
          opacity: 0,
          x: -30,
          filter: "blur(8px)",
        }}
        animate={{
          opacity: 1,
          x: 0,
          filter: "blur(0px)",
        }}
        transition={{
          duration: 0.7,
          ease: "easeOut",
          delay: 0.3,
        }}
      >
        <div
          className="text-white text-2xl font-bold"
          style={{
            fontFamily: "var(--font-tt-firs-neue), Arial, sans-serif",
          }}
        >
          <span className="text-red-800">A</span>URA
        </div>
      </motion.div>

      {/* Navigation Menu */}
      <motion.nav
        className="flex ml-30 items-center space-x-2 bg-tranparent backdrop-blur-md border border-white/20 px-4 py-2 rounded-full"
        initial={{
          opacity: 0,
          y: -25,
          filter: "blur(10px)",
          scale: 0.95,
        }}
        animate={{
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          scale: 1,
        }}
        transition={{
          duration: 0.7,
          ease: "easeOut",
          delay: 0.4,
        }}
      >
        {navItems.map((item) => (
          <Link
            key={item.name}
            href={item.path}
            className={`transition-all duration-300 px-4 py-1 rounded-full ${
              isActive(item.path)
                ? "bg-transparent text-white border border-white/30 shadow-inner"
                : "text-gray-300 hover:text-white hover:bg-white/10"
            }`}
            style={
              isActive(item.path)
                ? {
                    boxShadow:
                      "inset 0 0 16px rgba(239, 68, 68, 0.3), 0 4px 6px rgba(0, 0, 0, 0.2)",
                  }
                : {}
            }
          >
            {item.name}
          </Link>
        ))}
      </motion.nav>

      {/* Right Side Buttons glassmorphic button*/}
      <motion.div
        className="flex items-center space-x-4"
        initial={{
          opacity: 0,
          x: 30,
          filter: "blur(8px)",
        }}
        animate={{
          opacity: 1,
          x: 0,
          filter: "blur(0px)",
        }}
        transition={{
          duration: 0.7,
          ease: "easeOut",
          delay: 0.5,
        }}
      >
        <ConnectButton.Custom>
          {({
            account,
            chain,
            openAccountModal,
            openConnectModal,
            authenticationStatus,
            mounted,
          }) => {
            // Note: If your app doesn't use authentication, you
            // can remove all 'authenticationStatus' checks
            const ready = mounted && authenticationStatus !== "loading";
            const connected =
              ready &&
              account &&
              chain &&
              (!authenticationStatus ||
                authenticationStatus === "authenticated");

            return (
              <div
                {...(!ready && {
                  "aria-hidden": true,
                  style: {
                    opacity: 0,
                    pointerEvents: "none",
                    userSelect: "none",
                  },
                })}
              >
                {(() => {
                  if (!connected) {
                    return (
                      <button
                        onClick={openConnectModal}
                        type="button"
                        className="backdrop-blur-md border border-white/20 hover:bg-white/10 transition-all duration-300 px-6 py-2 rounded-full text-white shadow-inner"
                        style={{
                          boxShadow:
                            "inset 0 0 16px rgba(239, 68, 68, 0.3), 0 4px 6px rgba(0, 0, 0, 0.1)",
                        }}
                      >
                        Connect Wallet
                      </button>
                    );
                  }

                  if (chain.unsupported) {
                    return (
                      <button
                        onClick={handleSwitchToAvalancheFuji}
                        type="button"
                        className="backdrop-blur-md border border-red-500/50 hover:bg-red-500/10 transition-all duration-300 px-6 py-2 rounded-full text-red-300 shadow-inner"
                        style={{
                          boxShadow:
                            "inset 0 0 16px rgba(239, 68, 68, 0.5), 0 4px 6px rgba(0, 0, 0, 0.1)",
                        }}
                      >
                        Switch to Avalanche Fuji
                      </button>
                    );
                  }

                  return (
                    <div className="flex items-center space-x-2">
                      {/* <button
                        onClick={openChainModal}
                        type="button"
                        className="backdrop-blur-md border border-white/20 hover:bg-white/10 transition-all duration-300 px-3 py-2 rounded-full text-white shadow-inner flex items-center space-x-2"
                        style={{
                          boxShadow:
                            "inset 0 0 16px rgba(239, 68, 68, 0.3), 0 4px 6px rgba(0, 0, 0, 0.1)",
                        }}
                      >
                        {chain.hasIcon && (
                          <div
                            style={{
                              background: chain.iconBackground,
                              width: 16,
                              height: 16,
                              borderRadius: 999,
                              overflow: 'hidden',
                              marginRight: 4,
                            }}
                          >
                            {chain.iconUrl && (
                              <img
                                alt={chain.name ?? 'Chain icon'}
                                src={chain.iconUrl}
                                style={{ width: 16, height: 16 }}
                              />
                            )}
                          </div>
                        )}
                        {chain.name}
                      </button> */}

                      <button
                        onClick={openAccountModal}
                        type="button"
                        className="backdrop-blur-md border border-white/20 hover:bg-white/10 transition-all duration-300 px-6 py-2 rounded-full text-white shadow-inner"
                        style={{
                          boxShadow:
                            "inset 0 0 16px rgba(239, 68, 68, 0.3), 0 4px 6px rgba(0, 0, 0, 0.1)",
                        }}
                      >
                        {account.displayName}
                        {account.displayBalance
                          ? ` (${account.displayBalance})`
                          : ""}
                      </button>
                    </div>
                  );
                })()}
              </div>
            );
          }}
        </ConnectButton.Custom>
      </motion.div>
    </motion.header>
  );
}

export default Header;
