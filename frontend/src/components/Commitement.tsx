"use client";

import { useState, useRef } from "react";
import { ChevronLeft, ChevronRight, Settings } from "lucide-react";
import { motion, useInView } from "motion/react";

export default function AuraCommitmentSection() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const titleRef = useRef(null);
  const cardRef = useRef(null);
  const titleInView = useInView(titleRef, {
    once: true,
    margin: "0px 0px -100px 0px",
  });
  const cardInView = useInView(cardRef, {
    once: true,
    margin: "0px 0px -50px 0px",
  });

  const slides = [
    {
      icon: <Settings className="w-8 h-8" />,
      text: "Aura Protocol is committed to revolutionizing DeFi with cutting-edge technology. We provide a decentralized, secure, and efficient ecosystem for the future of finance.",
    },
    {
      icon: <Settings className="w-8 h-8" />,
      text: "Advanced smart contracts and innovative tokenomics ensure maximum security and optimal returns for our community members and stakeholders.",
    },
    {
      icon: <Settings className="w-8 h-8" />,
      text: "Transparent governance and community-driven development make Aura Protocol the trusted choice for DeFi enthusiasts worldwide.",
    },
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  return (
    <div className="py-20">
      <section className="relative min-h-screen flex items-center justify-center  overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Starfield */}

          {/* Curved orbital lines */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 border border-red-500/20 rounded-full transform -rotate-12"></div>
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 border border-red-400/15 rounded-full transform rotate-45"></div>

          {/* Decorative circles */}
          <div className="absolute top-1/3 left-1/6 w-4 h-4 bg-red-500/30 rounded-full"></div>
          <div className="absolute bottom-1/3 right-1/6 w-6 h-6 bg-red-400/20 rounded-full"></div>
          <div className="absolute top-2/3 right-1/3 w-3 h-3 bg-red-600/25 rounded-full"></div>

          {/* Star accent */}
          <div className="absolute top-1/4 right-1/3">
            <div className="relative w-4 h-4">
              <div className="absolute inset-0 bg-red-400/40 transform rotate-45"></div>
              <div className="absolute inset-0 bg-red-400/40 transform -rotate-45"></div>
            </div>
          </div>

          {/* Curved lines */}
          <svg
            className="absolute top-0 left-0 w-full h-full"
            viewBox="0 0 1200 800"
            fill="none"
          >
            <path
              d="M100 400 Q 300 200 600 350 T 1100 300"
              stroke="url(#redGradient)"
              strokeWidth="1"
              fill="none"
              opacity="0.3"
            />
            <path
              d="M200 600 Q 500 400 800 550 T 1000 500"
              stroke="url(#redGradient2)"
              strokeWidth="1"
              fill="none"
              opacity="0.2"
            />
            {/* Top curve connecting to card */}
            <path
              d="M400 100 Q 600 200 800 100"
              stroke="url(#redGradient3)"
              strokeWidth="2"
              fill="none"
              opacity="0.4"
            />
            {/* Bottom curve connecting to card */}
            <path
              d="M400 700 Q 600 600 800 700"
              stroke="url(#redGradient3)"
              strokeWidth="2"
              fill="none"
              opacity="0.4"
            />
            <defs>
              <linearGradient
                id="redGradient"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <stop
                  offset="0%"
                  stopColor="rgb(239 68 68)"
                  stopOpacity="0.1"
                />
                <stop
                  offset="50%"
                  stopColor="rgb(220 38 38)"
                  stopOpacity="0.3"
                />
                <stop
                  offset="100%"
                  stopColor="rgb(239 68 68)"
                  stopOpacity="0.1"
                />
              </linearGradient>
              <linearGradient
                id="redGradient2"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <stop
                  offset="0%"
                  stopColor="rgb(220 38 38)"
                  stopOpacity="0.1"
                />
                <stop
                  offset="50%"
                  stopColor="rgb(185 28 28)"
                  stopOpacity="0.2"
                />
                <stop
                  offset="100%"
                  stopColor="rgb(220 38 38)"
                  stopOpacity="0.1"
                />
              </linearGradient>
              <linearGradient
                id="redGradient3"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <stop
                  offset="0%"
                  stopColor="rgb(239 68 68)"
                  stopOpacity="0.2"
                />
                <stop
                  offset="50%"
                  stopColor="rgb(220 38 38)"
                  stopOpacity="0.6"
                />
                <stop
                  offset="100%"
                  stopColor="rgb(239 68 68)"
                  stopOpacity="0.2"
                />
              </linearGradient>
            </defs>
          </svg>

          {/* Bottom Glow with Stars */}
          <div className="absolute -bottom-80 left-1/2  -translate-x-1/2 min-w-screen h-[800px] pointer-events-none">
            <div
              className="absolute left-1/2 bottom-0 -translate-x-1/2  translate-y-[73%] min-w-[3000px] h-[3000px] rounded-full "
              style={{
                backgroundColor: "black",
                boxShadow:
                  "inset 0 0 100px 20px rgba(239, 68, 68, 0.1), inset 0 0 200px 50px rgba(220, 38, 38, 0.2)",
              }}
            />
          </div>
        </div>

        <div className="relative z-10 max-w-6xl mx-auto text-center">
          {/* Main heading */}
          <div ref={titleRef} className="">
            <motion.h1
              className="text-4xl -mt-40 md:text-7xl font-light text-white mb-4 tracking-tight leading-tight"
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
                titleInView
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
                delay: 0.2,
              }}
            >
              <span
                className="block"
                style={{
                  fontFamily: "var(--font-tt-firs-neue), Arial, sans-serif",
                }}
              >
                AURA
              </span>
              <span
                className="block"
                style={{
                  fontFamily: "var(--font-tt-firs-neue), Arial, sans-serif",
                }}
              >
                COMMITMENT
              </span>
              <span
                className="block"
                style={{
                  fontFamily: "var(--font-tt-firs-neue), Arial, sans-serif",
                }}
              >
                TO YOU!
              </span>
            </motion.h1>
          </div>

          {/* Main card - curved/bent shape */}
          <motion.div
            ref={cardRef}
            className="relative max-w-4xl mx-auto"
            initial={{
              opacity: 0,
              y: -30,
              filter: "blur(10px)",
              scale: 0.95,
            }}
            animate={
              cardInView
                ? {
                    opacity: 1,
                    y: 0,
                    filter: "blur(0px)",
                    scale: 1,
                  }
                : {
                    opacity: 0,
                    y: -30,
                    filter: "blur(10px)",
                    scale: 0.95,
                  }
            }
            transition={{
              duration: 0.9,
              delay: 0.6,
              ease: "easeOut",
            }}
          >
            {/* Navigation arrows */}
            <button
              onClick={prevSlide}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-black/20 backdrop-blur-sm border border-red-500/20 hover:bg-red-500/10 hover:border-red-400/30 text-white flex items-center justify-center transition-all"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <button
              onClick={nextSlide}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-black/20 backdrop-blur-sm border border-red-500/20 hover:bg-red-500/10 hover:border-red-400/30 text-white flex items-center justify-center transition-all"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* Curved/Bent glassmorphic card */}
            <div className="relative perspective-1000">
              <div
                className="relative bg-black/20 backdrop-blur-xl border border-red-500/20 rounded-3xl p-12 md:p-16 overflow-hidden transform"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(0,0,0,0.3) 0%, rgba(153,27,27,0.1) 50%, rgba(0,0,0,0.3) 100%)",
                  transformStyle: "preserve-3d",
                  transform: "perspective(1000px) rotateX(5deg) rotateY(-2deg)",
                }}
              >
                {/* Card background gradient overlay */}
                {/* <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-transparent to-red-600/10 rounded-3xl"></div> */}

                {/* Top glow effect */}
                <div className="absolute -top-20 left-1/2 transform -translate-x-1/2 w-full h-40">
                  <div className="w-full h-full bg-gradient-to-b from-red-400/15 via-red-500/8 to-transparent rounded-full blur-2xl"></div>
                </div>

                {/* Bottom glow effect */}
                <div className="absolute -bottom-20 left-1/2 transform -translate-x-1/2 w-full h-40">
                  <div className="w-full h-full bg-gradient-to-t from-red-400/15 via-red-500/8 to-transparent rounded-full blur-2xl"></div>
                </div>

                <div className="relative z-10">
                  {/* Icon */}
                  <div className="mb-8 flex justify-center">
                    <div className="w-16 h-16 rounded-full bg-red-500/20 backdrop-blur-sm border border-red-300/30 flex items-center justify-center text-red-300">
                      {slides[currentSlide].icon}
                    </div>
                  </div>

                  {/* Content */}
                  <p className="text-xl md:text-2xl text-white/90 leading-relaxed max-w-3xl mx-auto">
                    {slides[currentSlide].text}
                  </p>
                </div>
              </div>
            </div>

            {/* Pagination dots */}
            <div className="flex justify-center mt-8 gap-3">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentSlide
                      ? "bg-red-500 scale-125"
                      : "bg-red-500/30 hover:bg-red-500/50"
                  }`}
                />
              ))}
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
