import { useEffect, useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  open: boolean;
  photos: string[];
  onClose: () => void;
}

export function PhotoDrawer({ open, photos, onClose }: Props) {
  const [visible, setVisible] = useState(false);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (open) {
      setVisible(true);
      setCurrent(0);
    } else {
      const timer = setTimeout(() => setVisible(false), 500);
      return () => clearTimeout(timer);
    }
  }, [open]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight")
        setCurrent((c) => Math.min(c + 1, photos.length - 1));
      if (e.key === "ArrowLeft") setCurrent((c) => Math.max(c - 1, 0));
    };
    if (open) window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, photos.length]);

  if (!open && !visible) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 transition-opacity duration-500"
        style={{ backgroundColor: "rgba(0,0,0,0.2)", opacity: open ? 1 : 0 }}
        onClick={onClose}
      />
      <div
        className="fixed top-2 right-2 bottom-2 w-[480px] z-50 flex flex-col bg-white rounded-lg border border-[#e5e5e5] overflow-hidden"
        style={{
          boxShadow:
            "0 4px 6px -2px rgba(16,24,40,0.03), 0 12px 16px -4px rgba(16,24,40,0.08)",
          animation: open
            ? "slideInFromRight 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards"
            : "slideOutToRight 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e5e5e5] flex-shrink-0">
          <div>
            <p className="text-[15px] font-medium text-sp-text-primary">
              Patient photos
            </p>
            <p className="text-[12px] text-sp-text-secondary mt-0.5">
              {photos.length} photo{photos.length > 1 ? "s" : ""} attached
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-sp-text-secondary hover:text-sp-text-primary transition-colors p-1 rounded hover:bg-sp-bg"
          >
            <X size={16} />
          </button>
        </div>

        {/* Photo viewer */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Main photo */}
          <div className="flex-1 relative flex items-center justify-center bg-gray-50 overflow-hidden">
            <img
              src={photos[current]}
              alt={`Patient photo ${current + 1}`}
              className="max-w-full max-h-full object-contain"
              style={{ padding: "16px" }}
            />

            {/* Prev / Next */}
            {photos.length > 1 && (
              <>
                <button
                  onClick={() => setCurrent((c) => Math.max(c - 1, 0))}
                  disabled={current === 0}
                  className="absolute left-3 p-2 rounded-full transition-all disabled:opacity-20"
                  style={{ background: "rgba(0,0,0,0.4)", color: "white" }}
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={() =>
                    setCurrent((c) => Math.min(c + 1, photos.length - 1))
                  }
                  disabled={current === photos.length - 1}
                  className="absolute right-3 p-2 rounded-full transition-all disabled:opacity-20"
                  style={{ background: "rgba(0,0,0,0.4)", color: "white" }}
                >
                  <ChevronRight size={18} />
                </button>
              </>
            )}
          </div>

          {/* Footer navigation */}
          <div className="flex flex-col items-center gap-3 px-4 py-4 border-t border-[#e5e5e5] flex-shrink-0">
            {/* Counter + arrows */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setCurrent((c) => Math.max(c - 1, 0))}
                disabled={current === 0}
                className="p-2 rounded-lg transition-all disabled:opacity-20 hover:bg-gray-100"
                style={{ border: "0.5px solid #E5E7EB" }}
              >
                <ChevronLeft size={18} style={{ color: "#1F5C5E" }} />
              </button>

              <span className="text-[14px] font-medium text-sp-text-primary">
                {current + 1}{" "}
                <span className="text-sp-text-secondary font-normal">
                  of {photos.length}
                </span>
              </span>

              <button
                onClick={() =>
                  setCurrent((c) => Math.min(c + 1, photos.length - 1))
                }
                disabled={current === photos.length - 1}
                className="p-2 rounded-lg transition-all disabled:opacity-20 hover:bg-gray-100"
                style={{ border: "0.5px solid #E5E7EB" }}
              >
                <ChevronRight size={18} style={{ color: "#1F5C5E" }} />
              </button>
            </div>

            {/* Keyboard hint */}
            {photos.length > 1 && (
              <p className="text-[11px] text-sp-text-secondary">
                Use{" "}
                <kbd
                  style={{
                    border: "1px solid #cbd5e1",
                    borderRadius: "4px",
                    padding: "1px 5px",
                    fontSize: "10px",
                    color: "#64748b",
                  }}
                >
                  ←
                </kbd>{" "}
                <kbd
                  style={{
                    border: "1px solid #cbd5e1",
                    borderRadius: "4px",
                    padding: "1px 5px",
                    fontSize: "10px",
                    color: "#64748b",
                  }}
                >
                  →
                </kbd>{" "}
                to navigate between photos
              </p>
            )}

            {/* Thumbnails */}
            {photos.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {photos.map((url, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrent(i)}
                    className="flex-shrink-0 rounded overflow-hidden transition-all"
                    style={{
                      width: "48px",
                      height: "48px",
                      border:
                        i === current
                          ? "2px solid #1F5C5E"
                          : "2px solid transparent",
                      opacity: i === current ? 1 : 0.5,
                    }}
                  >
                    <img
                      src={url}
                      alt={`Thumbnail ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
