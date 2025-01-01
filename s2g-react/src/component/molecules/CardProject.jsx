import React, { useState, useRef } from "react";

export function CardProject({ href, onEditClick }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const cardRef = useRef(null);

  const handleMouseLeave = () => {
    setShowDropdown(false);
  };

  const handleButtonClick = (event) => {
    event.preventDefault(); // Empêche le comportement par défaut du lien
    setShowDropdown(!showDropdown);
  };

  return (
    <a href={href}>
      <div
        ref={cardRef}
        className="relative text-white rounded-3xl w-40 h-40 flex justify-center items-center"
        onMouseLeave={handleMouseLeave}
      >
        {/* Ajout de onMouseLeave pour fermer le menu au départ de la div */}
        <img
          className="absolute rounded-3xl"
          src="../img/Logo1pic.jpg"
          alt="Plus-circle icon"
        />
        <div className="absolute w-full h-full opacity-0 rounded-3xl hover:opacity-100 bg-black/50 duration-300 hover:border-slate-200 border">
          <p className="absolute flex justify-center text-xl items-end inset-0 font-bungee ">
            <span className=" overflow-hidden p-3">Project</span>
          </p>
          <button
            className="absolute top-3 right-0"
            onClick={handleButtonClick}
          >
            <img
              src="../img/icon/three-dots-vertical.svg"
              alt="dots details icon"
            />
          </button>
          {showDropdown && (
            <div
              className="absolute top-10 right-4 Glassmorphgisme-noHover rounded-lg"
              onClick={handleButtonClick}
            >
              <ul className="px-2 py-1 divide-y">
                <div className="py-1 ">
                  <li
                    onClick={onEditClick}
                    className="cursor-pointer px-1.5 py-0.5 hover:bg-black/30 rounded-lg text-sm/6 "
                  >
                    Edit
                  </li>
                </div>
                <div className="py-1">
                  <li className="cursor-pointer px-1.5 py-0.5  hover:bg-black/30 rounded-lg text-sm/6">
                    Export File
                  </li>
                </div>
                <div className="py-1">
                  <li className="cursor-pointer px-1.5 py-0.5  hover:bg-black/30 rounded-lg text-sm/6">
                    Export QR code
                  </li>
                </div>
                <div className="py-1">
                  <li className="cursor-pointer px-1.5 py-0.5  hover:bg-black/30 rounded-lg text-sm/6 text-red-500">
                    Delete
                  </li>
                </div>
              </ul>
            </div>
          )}
        </div>
      </div>
    </a>
  );
}
