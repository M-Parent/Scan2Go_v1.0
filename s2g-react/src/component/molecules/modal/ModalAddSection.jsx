import React, { useState } from "react";
import { ModalTitle } from "./ModalTitle";
import { ModalFooter } from "./ModalFooter";
import API_BASE_URL from "../../../api";

export function ModalAddSection({ id, onCloseModalAddSection, projectId }) {
  const [sectionNames, setSectionNames] = useState([{ name: "", error: "" }]);
  const [errors, setErrors] = useState({});
  const [serverErrors, setServerErrors] = useState({}); // Store server errors

  const handleSectionNameChange = (index, event) => {
    const newSectionNames = [...sectionNames];
    newSectionNames[index].name = event.target.value;

    const newErrors = { ...errors };

    // Frontend duplicate check
    for (let i = 0; i < newSectionNames.length; i++) {
      if (
        newSectionNames[i].name &&
        newSectionNames.filter((item) => item.name === newSectionNames[i].name)
          .length > 1
      ) {
        newErrors[newSectionNames[i].name] = "Duplicate section name.";
        newSectionNames[i].error = "Duplicate section name.";
      } else {
        delete newErrors[newSectionNames[i].name];
        newSectionNames[i].error = "";
      }
    }

    setSectionNames(newSectionNames);
    setErrors(newErrors);
    setServerErrors({}); // Clear server errors on input change
  };

  const handleAddSection = () => {
    if (sectionNames.length < 50) {
      setSectionNames([...sectionNames, { name: "", error: "" }]);
    }
  };

  const handleRemoveSection = (index) => {
    const newSectionNames = sectionNames.filter((_, i) => i !== index);
    setSectionNames(newSectionNames);
    setErrors({}); // Clear global errors as well
  };

  const incrementCount = () => {
    handleAddSection();
  };

  const decrementCount = () => {
    if (sectionNames.length > 1) {
      handleRemoveSection(sectionNames.length - 1);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrors({});
    setServerErrors({}); // Clear any previous server errors

    if (Object.keys(errors).length > 0) {
      alert("Please correct the errors before submitting.");
      return;
    }

    const formData = new FormData();
    formData.append("projectId", projectId);
    sectionNames.forEach((section) => {
      if (section.name) {
        formData.append("sectionNames[]", section.name);
      }
    });

    try {
      const response = await fetch(`${API_BASE_URL}/api/sections/addsections`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.errors) {
          // Handle both frontend and backend errors
          setServerErrors(errorData.errors); // Set server errors
          // Example: If the server returns { errors: { sectionName1: "Name already exists" } }
          for (const key in errorData.errors) {
            const index = sectionNames.findIndex(
              (section) => section.name === key
            );
            if (index !== -1) {
              const newSectionNames = [...sectionNames];
              newSectionNames[index].error = errorData.errors[key]; // Set server error on the input
              setSectionNames(newSectionNames);
            }
          }
        } else {
          throw new Error(errorData.message || "Error adding sections");
        }
      } else {
        onCloseModalAddSection();
        window.location.reload();
      }
    } catch (error) {
      console.error("API request error:", error);
      alert(error.message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <ModalTitle title="Add Section" onClose={onCloseModalAddSection} />
      <div className="pt-7 md:px-14 px-7">
        <div className="mt-5 flex items-center">
          <label className="me-4" htmlFor={id}>
            Section Count:
          </label>
          <div className="flex items-center">
            {" "}
            {/* Container for +/- and count */}
            <button
              type="button"
              onClick={decrementCount}
              className="bg-white/30 hover:bg-white/50 boder-white border-y border-s text-white font-bold px-3 py-1 rounded-s-xl"
            >
              -
            </button>
            <span className="px-3 py-1 border-white border-y">
              {sectionNames.length}
            </span>
            <button
              type="button"
              onClick={incrementCount}
              className="bg-white/30 hover:bg-white/50 boder-white border-y border-e text-white font-bold px-3 py-1 rounded-e-xl"
            >
              +
            </button>
          </div>
        </div>
        <div className="overflow-auto h-24 scrollbar-custom mt-1 pe-6">
          {sectionNames.map((section, index) => (
            <div key={index} className="my-2.5">
              <div className="flex items-center">
                <input
                  type="text"
                  placeholder="Section name..."
                  value={section.name}
                  onChange={(event) => handleSectionNameChange(index, event)}
                  className={`block w-full rounded-xl bg-transparent px-3 py-1.5 text-base outline outline-1 -outline-offset-1 placeholder:text-white focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 ${
                    section.error ||
                    (serverErrors && serverErrors[section.name])
                      ? "border-red-500"
                      : "" // Conditional border
                  }`}
                />
                <button
                  type="button"
                  onClick={() => handleRemoveSection(index)}
                  className="text-red-500 ml-2"
                >
                  <div className="bg-white/20 hover:bg-red-700 boder-white border p-1.5 rounded-lg">
                    <img
                      src="../../../img/icon/trash.svg"
                      width={28}
                      alt="Trash-Can"
                    />
                  </div>
                </button>
              </div>
              {(section.error ||
                (serverErrors && serverErrors[section.name])) && (
                <div className="text-red-500 mt-1">
                  {section.error && <p>{section.error}</p>}{" "}
                  {/* Only display client-side error if present */}
                  {/* Only display server-side error if client-side error is NOT present */}
                  {!section.error &&
                    serverErrors &&
                    serverErrors[section.name] && (
                      <p>{serverErrors[section.name]}</p>
                    )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      <ModalFooter name="ADD" onClose={onCloseModalAddSection} />
    </form>
  );
}
