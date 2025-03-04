import React, { useState, useRef } from "react";

export function SearchBarGlass({ onSearch, projectId }) {
  const [searchTerm, setSearchTerm] = useState("");
  const inputRef = useRef(null);

  const handleChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleSubmit = (event) => {
    event.preventDefault(); // Empêche la soumission par défaut du formulaire
    onSearch(searchTerm, projectId); // Appelle onSearch avec le searchTerm actuel
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex justify-center">
        <div className="relative">
          <input
            ref={inputRef}
            className="sm:w-[500px] w-72 mx-auto rounded-full bg-white/30 px-3 py-1.5 text-base border-white border text-white placeholder:text-white/70 focus:outline focus:outline-2 focus:-outline-offset-1 focus:outline-indigo-600 sm:text-sm/6"
            type="text"
            id="search-bar"
            name="search-bar"
            placeholder="Search bar..."
            value={searchTerm}
            onChange={handleChange}
          />
          <button type="submit">
            <img
              className="absolute top-[5px] right-[5px] bg-white/30 rounded-full px-3 py-1.5"
              src="../img/icon/search.svg"
              alt="Search-icon"
            />
          </button>
        </div>
      </div>
    </form>
  );
}
