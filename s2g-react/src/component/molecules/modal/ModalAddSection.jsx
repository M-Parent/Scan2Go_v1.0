import React, { useState } from "react";
import { ModalTitle } from "./ModalTitle";
import { ModalFooter } from "./ModalFooter";

export function ModalAddSection({ id, onCloseModalAddSection }) {
  const [inputValue, setInputValue] = useState(1); // Valeur par défaut à 1
  const [textFields, setTextFields] = useState([1]); // Valeur par défaut à 1

  const handleInputChange = (event) => {
    const newValue = Math.max(1, Math.min(20, +event.target.value)); // Limites entre 1 et 10
    setInputValue(newValue);
    setTextFields(new Array(+event.target.value).fill(""));
  };
  return (
    <form>
      <ModalTitle
        title="Add Section"
        onClose={() => onCloseModalAddSection()}
      />
      <div className="pt-7 md:px-14 px-7">
        <div className="flex mt-5">
          <label className="flex items-center me-4" for={id}>
            Add Section:
          </label>
          <input
            className="w-14 rounded-xl bg-transparent px-3 py-1.5 text-base outline outline-1 -outline-offset-1 placeholder:text-white focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
            type="number"
            value={inputValue}
            onChange={handleInputChange}
          />
        </div>
        <div className="overflow-auto h-24 scrollbar-custom mt-1 pe-6">
          {textFields.map((_, index) => (
            <input
              className="block w-full rounded-xl bg-transparent px-3 py-1.5 my-2.5 text-base outline outline-1 -outline-offset-1 placeholder:text-white focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
              type="text"
              key={index}
              placeholder="Section name..."
            />
          ))}
        </div>
        {/* Footer */}
      </div>
      <ModalFooter name="ADD" onClose={() => onCloseModalAddSection()} />
    </form>
  );
}
