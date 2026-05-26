import { Activity } from "lucide-react";

interface Props {
  message?: string;
}

export function ServerError({
  message = "Clinical data cannot be loaded right now.",
}: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      {/* <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center"
        style={{ background: "#F3F4F6" }}
      >
        <Activity size={22} style={{ color: "#9CA3AF" }} />
      </div> */}
      <div className="text-center">
        <p className="text-[15px] font-medium" style={{ color: "#374151" }}>
          Server unavailable
        </p>
        <p
          className="text-[13px] mt-1"
          style={{ color: "#9CA3AF", maxWidth: "280px" }}
        >
          {message}
        </p>
      </div>
      {/* <button
        onClick={() => window.location.reload()}
        className="text-[12px] font-medium px-4 py-2 rounded-lg transition-colors hover:opacity-80"
        style={{ background: "#F3F4F6", color: "#6B7280" }}
      >
        Try again
      </button> */}
    </div>
  );
}
