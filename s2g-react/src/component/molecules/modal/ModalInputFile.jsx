import React from "react";

export function ModalInputFile(props) {
  const handleChange = (e) => {
    if (props.onChange) {
      props.onChange(e.target.files[0]); // Transmettre le fichier directement
    }
  };

  return (
    <div className="mt-3">
      <label className="block" htmlFor={props.for}>
        {props.label}
      </label>
      <div className="mt-2">
        <input
          className="block w-full rounded-xl bg-transparent border-white border  outline outline-1 -outline-offset-1 placeholder:text-white focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 file:px-2 file:py-1 file:bg-white/30 file:border-transparent file:text-white file: hover:file:bg-white/50 file:rounded-s-xl file:me-3"
          type="file"
          id={props.for}
          name={props.for} // Important pour le backend
          onChange={handleChange} // Utiliser une fonction interne pour gérer l'événement
          ref={props.ref}
        />
      </div>
    </div>
  );
}
