import React, { useRef } from "react";
import { Card } from "@/components/ui/card";
import { motion, useInView } from "motion/react";

function Why() {
  const headerRef = useRef(null);
  const cardsRef = useRef(null);
  const headerInView = useInView(headerRef, {
    once: true,
    margin: "0px 0px -100px 0px",
  });
  const cardsInView = useInView(cardsRef, {
    once: true,
    margin: "0px 0px -50px 0px",
  });

  return (
    <div className="py-20">
      <section className="a min-h-screen bg-transparent p-8  overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-red-600/15 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-black/20 rounded-full blur-2xl"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto">
          {/* Header */}
          <div ref={headerRef} className="text-center mb-16">
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-red-500/30 bg-red-500/5 mb-8"
              initial={{
                opacity: 0,
                y: -40,
                filter: "blur(12px)",
                scale: 0.9,
              }}
              animate={
                headerInView
                  ? {
                      opacity: 1,
                      y: 0,
                      filter: "blur(0px)",
                      scale: 1,
                    }
                  : {
                      opacity: 0,
                      y: -40,
                      filter: "blur(12px)",
                      scale: 0.9,
                    }
              }
              transition={{
                duration: 0.8,
                ease: "easeOut",
                delay: 0.1,
              }}
            >
              <div className="w-6 h-6 bg-red-500/20 rounded border border-red-500/40 flex items-center justify-center">
                <span className="text-red-400 font-bold text-sm">A</span>
              </div>
              <span className="text-red-100 font-medium">Aura Protocol</span>
            </motion.div>

            <motion.h1
              className="text-5xl md:text-6xl font-light text-white mb-4 tracking-wide"
              style={{
                fontFamily: "var(--font-tt-firs-neue), Arial, sans-serif",
              }}
              initial={{
                opacity: 0,
                filter: "blur(15px)",
                scale: 0.9,
                y: -50,
              }}
              animate={
                headerInView
                  ? {
                      opacity: 1,
                      filter: "blur(0px)",
                      scale: 1,
                      y: 0,
                    }
                  : {
                      opacity: 0,
                      filter: "blur(15px)",
                      scale: 0.9,
                      y: -50,
                    }
              }
              transition={{
                duration: 1,
                ease: "easeOut",
                delay: 0.3,
              }}
            >
              WHY CHOOSE AURA ?
            </motion.h1>
          </div>

          {/* Feature Cards Grid */}
          <motion.div
            ref={cardsRef}
            className="grid grid-cols-1 lg:grid-cols-9 gap-8 items-start"
            initial={{
              opacity: 0,
              y: -30,
              filter: "blur(10px)",
            }}
            animate={
              cardsInView
                ? {
                    opacity: 1,
                    y: 0,
                    filter: "blur(0px)",
                  }
                : {
                    opacity: 0,
                    y: -30,
                    filter: "blur(10px)",
                  }
            }
            transition={{
              duration: 0.9,
              delay: 0.5,
              ease: "easeOut",
            }}
          >
            {/* CEX-Like Speed Card */}
            <Card className="relative bg-gradient-to-br col-span-4 from-red-950/40 to-black/60 border-red-500/20 backdrop-blur-sm p-8 h-[400px] overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent"></div>
              <div className="absolute top-4 left-4 px-3 py-1 bg-red-500/20 border border-red-500/30 rounded-full">
                <span className="text-red-200 text-sm font-medium">01 CEX</span>
              </div>

              <div className="relative z-10 h-full flex flex-col">
                <div className="flex items-center gap-3 mb-6 mt-12">
                  <div className="w-10 h-10 bg-red-500/20 rounded-full border border-red-500/40 flex items-center justify-center">
                    <span className="text-red-400 font-bold">A</span>
                  </div>
                  <div className="w-6 h-6 bg-red-600/30 rounded-full"></div>
                </div>

                <div className="flex-1">
                  <h3
                    className="text-2xl font-light text-white mb-4 flex items-center gap-2"
                    style={{
                      fontFamily: "var(--font-tt-firs-neue), Arial, sans-serif",
                    }}
                  >
                    DeFi Innovation
                    <div className="w-6 h-6 text-red-400">
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    </div>
                  </h3>
                  <p className="text-red-100/70 text-sm leading-relaxed">
                    Revolutionary DeFi solutions that combine the security of
                    blockchain with innovative financial products, creating new
                    opportunities for decentralized finance.
                  </p>
                </div>
              </div>

              {/* Decorative circles */}
              <div className="absolute bottom-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-xl"></div>
              <div className="absolute top-1/2 right-0 w-20 h-20 bg-red-600/15 rounded-full blur-lg"></div>
            </Card>

            {/* Innovative Technology Card */}
            <Card className="relative bg-gradient-to-br mt-20 col-span-3 from-red-950/30 to-black/50 border-red-500/20 backdrop-blur-sm p-8 h-[400px] overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent"></div>

              <div className="relative z-10 h-full flex flex-col justify-center">
                <h3
                  className="text-2xl font-light text-white mb-6"
                  style={{
                    fontFamily: "var(--font-tt-firs-neue), Arial, sans-serif",
                  }}
                >
                  Smart Contracts
                </h3>
                <p className="text-red-100/70 text-sm leading-relaxed mb-8">
                  Powered by advanced smart contract technology on Avalanche,
                  our protocol offers unmatched security, transparency, and
                  efficiency for all DeFi operations.
                </p>

                <div className="flex justify-center">
                  <div className="w-12 h-12 bg-red-500/20 border border-red-500/30 rounded-full flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-red-400"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M12 2v20M2 12h20" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Large decorative circles */}
              <div className="absolute -top-16 -left-16 w-48 h-48 bg-red-500/5 rounded-full"></div>
              <div className="absolute -bottom-16 -right-16 w-40 h-40 bg-red-600/10 rounded-full"></div>
              <div className="absolute top-1/4 right-1/4 w-24 h-24 bg-red-500/8 rounded-full"></div>
            </Card>

            {/* Designed Efficiency Card */}
            <Card className="relative bg-gradient-to-br from-red-950/40 col-span-2 -mt-10 to-black/60 border-red-500/20 backdrop-blur-sm p-8 h-[400px] overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent"></div>

              <div className="relative z-10 h-full flex flex-col">
                <div className="flex justify-center mb-8 mt-8">
                  <div className="w-20 h-20 bg-red-500/10 border-2 border-red-500/30 rounded-2xl rotate-45 flex items-center justify-center">
                    <div className="w-12 h-12 bg-red-500/20 border border-red-500/40 rounded-lg -rotate-45 flex items-center justify-center">
                      <span className="text-red-400 font-bold text-lg">N</span>
                    </div>
                  </div>
                </div>

                <div className="flex-1">
                  <h3
                    className="text-2xl font-light text-white mb-6 text-center"
                    style={{
                      fontFamily: "var(--font-tt-firs-neue), Arial, sans-serif",
                    }}
                  >
                    Designed Efficiency
                  </h3>
                  <p className="text-red-100/70 text-sm leading-relaxed text-center">
                    With a streamlined, NOS Exchange simplifies your trading
                    experience, allowing you to focus on execution with speed
                    and precision.
                  </p>
                </div>
              </div>

              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/8 rounded-full blur-lg"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-red-600/10 rounded-full blur-xl"></div>
            </Card>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

export default Why;
