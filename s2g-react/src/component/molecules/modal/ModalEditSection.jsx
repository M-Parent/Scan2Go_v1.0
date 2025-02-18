import React, { useState, useEffect } from "react";
import { ModalInputText } from "./ModalInputText";

import { ModalTitle } from "./ModalTitle";
import { ModalFooter } from "./ModalFooter";
import API_BASE_URL from "../../../api";

export function ModalEditSection({
  section,
  onCloseModalEditSection,
  onSectionUpdated,
}) {
  const [sectionName, setSectionName] = useState(section.section_name); // Initialize with the passed section name
  const [error, setError] = useState("");

  const handleSectionNameChange = (event) => {
    setSectionName(event.target.value);
    setError(""); // Clear error on input change
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(""); // Clear any previous errors

    if (!sectionName) {
      setError("Section name is required.");
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/sections/${section.id}`,
        {
          // Use section.id for update
          method: "PUT", // Use PUT method for update
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ section_name: sectionName }), // Send only the name
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || "Error updating section name."); // Set error message
        console.error("Error updating section:", response.status, errorData); // Log the error
      } else {
        const updatedSection = await response.json(); // Get the updated section from the server
        onSectionUpdated(updatedSection); // Call the callback with the updated section data
        onCloseModalEditSection();
      }
    } catch (error) {
      console.error("API request error:", error);
      setError("A network error occurred.");
    }
  };

  // useEffect to update sectionName when the section prop changes (important for edits)
  useEffect(() => {
    setSectionName(section.section_name);
  }, [section]);

  return (
    <form onSubmit={handleSubmit}>
      <ModalTitle title="Edit Section" onClose={onCloseModalEditSection} />
      <div className="pt-7 md:px-14 px-7">
        <div className="mt-5">
          <ModalInputText // Use ModalInputText component
            label="Section Name:"
            for="sectionName" // Match the 'for' attribute to the input's 'id' if needed.
            placeholder="Section name..."
            value={sectionName}
            onChange={handleSectionNameChange}
            error={error} // Pass the error message to ModalInputText
          />
        </div>
      </div>
      <ModalFooter name="Save" onClose={onCloseModalEditSection} />{" "}
      {/* Changed button name */}
    </form>
  );
}
