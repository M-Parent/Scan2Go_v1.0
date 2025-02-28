import React, { useState, useEffect } from "react";
import { ModalTitle } from "./ModalTitle";
import { ModalFooter } from "./ModalFooter";
import { ModalInputText } from "./ModalInputText";
import API_BASE_URL from "../../../api";

export function ModalEditFile({
  file,
  fileId,
  projectName,
  sectionName,
  sectionId,
  onCloseModalEditFile,
  onFileUploaded,
}) {
  const [fileName, setFileName] = useState(file?.name || "");
  const [selectedFile, setSelectedFile] = useState(null);
  const [tags, setTags] = useState([]);
  const [existingTags, setExistingTags] = useState([]);
  const [tagErrors, setTagErrors] = useState({});
  const [fileNameError, setFileNameError] = useState("");

  useEffect(() => {
    setFileName(file?.name || "");
  }, [file]);

  const handleFileNameChange = (event) => {
    setFileName(event.target.value);
    setFileNameError(""); // Clear previous error when typing
  };

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleTagChange = (index, event) => {
    const newTag = event.target.value.trim();
    const newTags = [...tags];
    newTags[index] = newTag;
    setTags(newTags);

    // Check for duplicate tags
    const errors = {};
    for (let i = 0; i < newTags.length; i++) {
      if (
        newTags[i] &&
        newTags.filter((tag) => tag === newTags[i]).length > 1
      ) {
        errors[newTags[i]] = "A tag with this name already exists.";
      }
    }
    setTagErrors(errors);
  };

  const handleAddTag = () => {
    if (tags.length >= 5) return;
    if (tags.includes("")) return;
    setTags([...tags, ""]);
  };

  const handleDeleteTag = (index) => {
    const newTags = tags.filter((_, i) => i !== index);
    setTags(newTags);

    // Clear tag errors if a tag is removed
    const newTagErrors = { ...tagErrors };
    delete newTagErrors[tags[index]];
    setTagErrors(newTagErrors);
  };

  useEffect(() => {
    const fetchTags = async () => {
      if (fileId) {
        try {
          const response = await fetch(
            `${API_BASE_URL}/api/uploadFile/files/${fileId}/tags`
          );
          if (response.ok) {
            const tagsData = await response.json();
            setTags(tagsData);
            setExistingTags(tagsData);
          } else {
            console.error("Failed to fetch tags:", response.status);
          }
        } catch (error) {
          console.error("Error fetching tags:", error);
        }
      }
    };
    fetchTags();
  }, [fileId]);

  const checkFileNameExists = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/uploadFile/checkFileName?sectionId=${sectionId}&fileName=${fileName}`
      );
      const data = await response.json();
      if (data.exists && fileName !== file.name) {
        setFileNameError("A file with this name already exists.");
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error checking file name:", error);
      return false;
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const fileNameExists = await checkFileNameExists();
    if (fileNameExists) {
      return; // Prevent submission if file name exists
    }

    const tagsToDelete = existingTags.filter((tag) => !tags.includes(tag));

    if (tagsToDelete.length > 0) {
      try {
        await fetch(
          `${API_BASE_URL}/api/uploadFile/files/${fileId}/tags/delete`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tags: tagsToDelete }),
          }
        );
      } catch (error) {
        console.error("Error deleting tags:", error);
      }
    }

    const formData = new FormData();
    formData.append("fileName", fileName);
    formData.append("projectName", projectName);
    formData.append("sectionName", sectionName);

    tags.forEach((tag) => {
      formData.append("tags[]", tag);
    });

    if (selectedFile) {
      formData.append("file", selectedFile);
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/uploadFile/files/${fileId}`,
        {
          method: "PUT",
          body: formData,
        }
      );

      if (response.ok) {
        const tagsResponse = await fetch(
          `${API_BASE_URL}/api/uploadFile/files/${fileId}/tags`
        );
        if (tagsResponse.ok) {
          const updatedTags = await tagsResponse.json();
          setTags(updatedTags);
        }
        onFileUploaded();
        onCloseModalEditFile();
      }
    } catch (error) {
      console.error("Connection error:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <ModalTitle title="Edit File" onClose={onCloseModalEditFile} />
      <div className="flex justify-center pt-3 ">
        <p className="font-bold text-lg">
          {projectName} / {sectionName} /{" "}
          <span className="text-red-500">{fileName}</span>
        </p>
      </div>
      <div className="md:px-14 px-7">
        <ModalInputText
          label="File Name:"
          placeholder="Name file..."
          value={fileName}
          onChange={handleFileNameChange}
        />
        {fileNameError && (
          <p className="text-red-500 text-sm">{fileNameError}</p>
        )}
        <div className="my-3">
          <label
            htmlFor="projectFile"
            className="block text-sm font-medium text-white mb-2"
          >
            Upload File:
          </label>
          <input
            type="file"
            id="projectFile"
            accept=".zip,.png,.jpg,.jpeg,.swc,.txt"
            onChange={handleFileChange}
            className="block w-full rounded-xl bg-transparent border-white border  outline outline-1 -outline-offset-1 placeholder:text-white focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 file:px-2 file:py-1 file:bg-white/30 file:border-transparent file:text-white file: hover:file:bg-white/50 file:rounded-s-xl file:me-3"
          />
        </div>

        {/* Tags Section - Styled */}
        <div className="md:px-0 px-0">
          <div className="mt-5 flex items-center">
            <label className="me-4 text-sm font-medium text-white">
              Tag Count:
            </label>
            <div className="flex items-center">
              <button
                type="button"
                onClick={() => handleDeleteTag(tags.length - 1)}
                className="bg-white/30 hover:bg-white/50 boder-white border-y border-s text-white font-bold px-3 py-1 rounded-s-xl"
              >
                -
              </button>
              <span className="px-3 py-1 border-white border-y">
                {tags.length}
              </span>
              <button
                type="button"
                onClick={handleAddTag}
                className="bg-white/30 hover:bg-white/50 boder-white border-y border-e text-white font-bold px-3 py-1 rounded-e-xl"
              >
                +
              </button>
            </div>
          </div>

          <div className="overflow-auto h-24 scrollbar-custom mt-1 pe-6">
            {tags.map((tag, index) => (
              <div key={index} className="my-2.5">
                <div className="flex items-center">
                  <input
                    type="text"
                    placeholder="Tag name..."
                    value={tag}
                    onChange={(event) => handleTagChange(index, event)}
                    className={`block w-full rounded-xl bg-transparent px-3 py-1.5 text-base outline outline-1 -outline-offset-1 placeholder:text-white focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 ${
                      tagErrors[tag] ? "border-red-500" : ""
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => handleDeleteTag(index)}
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
                {tagErrors[tag] && (
                  <p className="text-red-500 text-sm">{tagErrors[tag]}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <ModalFooter name="Save" onClose={onCloseModalEditFile} />
    </form>
  );
}
