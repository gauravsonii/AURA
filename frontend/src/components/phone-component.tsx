import { Wifi, Battery, Signal } from "lucide-react";

export default function PhoneComponent() {
  return (
    <div
      className="relative w-[300px] h-[600px] bg-white/10 backdrop-blur-md border border-white/20 rounded-[3rem] p-2 shadow-2xl"
      style={{
        boxShadow:
          "inset 0 0 16px rgba(239, 68, 68, 0.2), 0 8px 32px rgba(0, 0, 0, 0.3)",
      }}
    >
      {/* Phone Frame */}
      <div className="w-full h-full bg-black/40 backdrop-blur-sm rounded-[2.5rem] relative overflow-hidden border border-white/10">
        {/* Background Abstract Shapes */}
        <div className="absolute inset-0">
          <div className="absolute top-20 right-10 w-32 h-32 bg-red-400/10 rounded-full blur-xl"></div>
          <div className="absolute bottom-40 left-8 w-24 h-24 bg-red-600/15 rounded-full blur-lg"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>
        </div>

        {/* Status Bar */}
        <div className="flex justify-between items-center px-6 pt-4 pb-2 relative z-10">
          <div className="text-white font-medium text-sm">9:41</div>

          {/* Dynamic Island */}
          <div className="absolute left-1/2 transform -translate-x-1/2 top-2 w-24 h-6 bg-black/80 backdrop-blur-sm rounded-full border border-white/10"></div>

          <div className="flex items-center space-x-1">
            <Signal className="w-4 h-4 text-white" />
            <Wifi className="w-4 h-4 text-white" />
            <Battery className="w-4 h-4 text-white" />
          </div>
        </div>

        {/* Main Content */}
      </div>
    </div>
  );
}
