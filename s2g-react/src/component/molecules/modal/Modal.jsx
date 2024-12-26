import React from "react";

export function Modal({ isVisible, children }) {
  if (!isVisible) return null;
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center">
      <div className="w-[512px]">
        <div className="Glassmorphgisme-noHover text-white rounded-full">
          {children}
        </div>
      </div>
    </div>
  );
}
