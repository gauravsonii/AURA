"use client";
import NOSCommitmentSection from "@/components/Commitement";
import PhoneComponent from "@/components/phone-component";
import GlowButton from "@/components/ui/glow-button";
import Why from "@/components/Why";
import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";

export default function Home() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Static 3D Glass Cards */}
      <motion.div
        className="absolute top-[20%] left-0 right-0 z-0"
        style={{ perspective: "1000px" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2, delay: 0.5 }}
      >
        {/* Card 1 - Far left */}
        <div
          className="absolute left-6 w-48 mt-16 h-64 bg-white/2 backdrop-blur-sm rounded-xl border border-white/5 shadow-2xl"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
            top: "65%",
            transform:
              "translateY(-50%) rotateY(45deg) rotateX(15deg) scale(0.8)",
            transformOrigin: "center center",
          }}
        />

        {/* Card 2 - Left */}
        <div
          className="absolute left-52 w-52 mt-8 h-68 bg-white/3 backdrop-blur-md rounded-lg border border-white/6 shadow-xl"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03))",
            top: "60%",
            transform:
              "translateY(-50%) rotateY(30deg) rotateX(12deg) scale(0.85)",
            transformOrigin: "center center",
          }}
        />

        {/* Card 3 - Center left */}
        <div
          className="absolute left-101 w-56 h-72 bg-white/2 backdrop-blur-lg rounded-2xl border border-white/5 shadow-2xl"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
            top: "55%",
            transform:
              "translateY(-50%) rotateY(15deg) rotateX(8deg) scale(0.9)",
            transformOrigin: "center center",
          }}
        />

        {/* Card 4 - Center */}
        <div
          className="absolute left-1/2 w-60 h-76 bg-white/4 backdrop-blur-sm rounded-lg border border-white/8 shadow-lg"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04))",
            top: "50%",
            transform: "translate(-50%, -50%) rotateX(5deg) scale(1)",
            transformOrigin: "center center",
          }}
        />

        {/* Card 5 - Center right */}
        <div
          className="absolute right-103 w-48 h-64 bg-white/3 backdrop-blur-md rounded-lg border border-white/7 shadow-lg"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03))",
            top: "55%",
            transform:
              "translateY(-50%) rotateY(-15deg) rotateX(8deg) scale(0.9)",
            transformOrigin: "center center",
          }}
        />

        {/* Card 6 - Right */}
        <div
          className="absolute right-52 w-52 mt-8 h-68 bg-white/2 backdrop-blur-lg rounded-xl border border-white/6 shadow-xl"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
            top: "60%",
            transform:
              "translateY(-50%) rotateY(-30deg) rotateX(12deg) scale(0.85)",
            transformOrigin: "center center",
          }}
        />

        {/* Card 7 - Far right */}
        <div
          className="absolute right-8 w-44 h-60 mt-16 bg-white/3 backdrop-blur-sm rounded-2xl border border-white/6 shadow-2xl"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03))",
            top: "65%",
            transform:
              "translateY(-50%) rotateY(-45deg) rotateX(15deg) scale(0.8)",
            transformOrigin: "center center",
          }}
        />
      </motion.div>

      {/* Main content container */}
      <div className="relative h-screen flex flex-col items-center justify-between text-center text-white z-20 relative mt-8 py-20">
        {/* Hero Section */}
        <motion.div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-red-500/30 bg-red-500/5 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <span className="text-red-100 font-medium flex justify-center items-center gap-2">
            Aura Protocol <ArrowRight className="h-4 w-4 " />
          </span>
        </motion.div>

        <div className="flex-1 flex  flex-col items-center justify-center">
          <motion.div
            className="text-6xl font-medium mb-6"
            style={{
              fontFamily: "var(--font-tt-firs-neue), Arial, sans-serif",
            }}
            initial={{ opacity: 0, filter: "blur(10px)", scale: 0.95 }}
            animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          >
            Fast. Efficient.
            <motion.div
              className="font-semibold text-7xl"
              style={{
                fontFamily: "var(--font-tt-firs-neue), Arial, sans-serif",
              }}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
            >
              Revolutionary.
            </motion.div>
          </motion.div>

          {/* Description */}
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8, ease: "easeOut" }}
          >
            <p className="text-gray-300 text-lg font-extralight">
              Experience the future of blockchain with Aura - where speed meets
              innovation.
            </p>
            <p className="text-gray-300 text-lg font-extralight">
              Powered by Avalanche
            </p>
          </motion.div>

          {/* Buttons */}
          <motion.div
            className="text-lg flex justify-center items-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.2, ease: "easeOut" }}
          >
            <button
              className="bg-white/10 backdrop-blur-md border border-white/20 px-6 py-2 rounded-full text-white mr-4 hover:bg-white/20 transition-all duration-300"
              style={{
                boxShadow:
                  "inset 4px 4px 16px rgba(239, 68, 68, 0.15), inset -4px -4px 16px rgba(239, 68, 68, 0.15)",
              }}
            >
              Lets Start Now
            </button>

            <GlowButton variant="red" className="px-6 py-2">
              Join Us
            </GlowButton>
          </motion.div>
        </div>

        {/* Phone and Cards Section */}
        <div className="relative z-20 flex-shrink-0">
          <div className="flex justify-center items-center gap-6 px-4 scale-75">
            {/* Ethereum Card */}
            <motion.div
              className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-4 w-64 relative overflow-hidden transform rotate-6 -translate-y-28 translate-x-36 z-50"
              style={{
                boxShadow:
                  "inset 4px 4px 16px rgba(239, 68, 68, 0.15), inset -4px -4px 16px rgba(239, 68, 68, 0.15)",
              }}
              initial={{ opacity: 0, y: 50 }}
              animate={{
                opacity: 1,
                y: [0, -15, 0],
              }}
              transition={{
                opacity: { duration: 1, delay: 1.5 },
                y: {
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1.5,
                },
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30">
                    <div className="w-6 h-6 bg-black rounded-full flex items-center justify-center">
                      <div
                        className="w-3 h-4 bg-white"
                        style={{
                          clipPath:
                            "polygon(50% 0%, 0% 40%, 50% 100%, 100% 40%)",
                        }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-lg">
                      Ethereum
                    </h3>
                    <p className="text-white/70 text-sm">ETH</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-white font-bold text-xl">$1,467.38</div>
                  <div className="text-green-300 text-sm">+7.45%</div>
                </div>
              </div>

              {/* Mini Chart */}
              <div className="mt-4 flex items-end space-x-1 h-8">
                {[
                  12, 8, 15, 10, 18, 14, 20, 16, 22, 18, 25, 20, 28, 24, 30,
                ].map((height, index) => (
                  <div
                    key={index}
                    className="bg-white/30 rounded-sm flex-1"
                    style={{ height: `${height}px` }}
                  ></div>
                ))}
              </div>
            </motion.div>
            {/* Phone Component */}
            <motion.div
              className="flex justify-center relative"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.2, delay: 1.8, ease: "easeOut" }}
            >
              {/* AURA text behind phone - horizontal layout */}
              <motion.div
                className="absolute top-1/2 left-1/2 transform -translate-x-170 -translate-y-1/2 z-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                transition={{ duration: 2, delay: 2.5 }}
              >
                <div
                  className="flex gap-8 text-white text-[250px] font-bold select-none"
                  style={{
                    fontFamily: "var(--font-tt-firs-neue), Arial, sans-serif",
                  }}
                >
                  <span className="text-red-700/90">A</span>
                  <span>U</span>
                </div>
              </motion.div>
              <motion.div
                className="absolute top-1/2 left-1/2 transform translate-x-80 -translate-y-1/2 z-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                transition={{ duration: 2, delay: 3 }}
              >
                <div
                  className="flex gap-8 text-white text-[250px] font-bold select-none"
                  style={{
                    fontFamily: "var(--font-tt-firs-neue), Arial, sans-serif",
                  }}
                >
                  <span>R</span>
                  <span>A</span>
                </div>
              </motion.div>

              <PhoneComponent />
            </motion.div>{" "}
            {/* Avalanche Card */}
            <motion.div
              className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-4 w-64 relative overflow-hidden transform -rotate-6  -translate-x-30"
              style={{
                boxShadow:
                  "inset 4px 4px 16px rgba(239, 68, 68, 0.15), inset -4px -4px 16px rgba(239, 68, 68, 0.15)",
              }}
              initial={{ opacity: 0, y: 50 }}
              animate={{
                opacity: 1,
                y: [0, -12, 0],
              }}
              transition={{
                opacity: { duration: 1, delay: 2 },
                y: {
                  duration: 5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 2,
                },
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30">
                    <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                      <div className="text-white font-bold text-sm">A</div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-lg">
                      Avalanche
                    </h3>
                    <p className="text-white/50 text-sm">AVAX</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-white font-bold text-xl">$24.65</div>
                  <div className="text-red-300 text-sm">-2.15%</div>
                </div>
              </div>

              {/* Mini Chart - Declining */}
              <div className="mt-4 flex items-end space-x-1 h-8">
                {[20, 18, 16, 14, 12, 10, 8, 6, 8, 10, 7, 5, 4, 6, 3].map(
                  (height, index) => (
                    <div
                      key={index}
                      className="bg-red-500/40 rounded-sm flex-1"
                      style={{ height: `${height}px` }}
                    ></div>
                  )
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <motion.div
        className="relative z-20 w-full mt-40"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 3.5 }}
      >
        <Why />
      </motion.div>

      <motion.div
        className="relative z-20 w-full -mt-20"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 4 }}
      >
        <NOSCommitmentSection />
      </motion.div>
    </div>
  );
}
