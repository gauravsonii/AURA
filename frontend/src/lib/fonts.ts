import localFont from "next/font/local";
import { DM_Sans } from "next/font/google";

export const ttFirsNeue = localFont({
  src: "../../public/fonts/TT Firs Neue Trial Regular.ttf",
  variable: "--font-tt-firs-neue",
  display: "swap",
});

export const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-dm-sans",
  display: "swap",
});
