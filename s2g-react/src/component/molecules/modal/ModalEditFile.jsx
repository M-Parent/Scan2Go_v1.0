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
  onCloseModalEditFile,
  onFileUploaded,
}) {
  const [fileName, setFileName] = useState(file?.name || "");
  const [selectedFile, setSelectedFile] = useState(null);
  const [tags, setTags] = useState([]);
  const [fileNameWarning, setFileNameWarning] = useState(null);
  const [serverErrors, setServerErrors] = useState(null);

  useEffect(() => {
    setFileName(file?.name || ""); // Mettre à jour fileName chaque fois que file change
  }, [file]);

  useEffect(() => {
    const fetchTags = async () => {
      if (fileId) {
        try {
          const response = await fetch(
            `${API_BASE_URL}/api/uploadFile/files/${fileId}/tags`
          );
          if (response.ok) {
            const tagsData = await response.json();
            setTags(tagsData.map((tag) => ({ name: tag })));
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

  const handleFileNameChange = (event) => {
    setFileName(event.target.value);
    setFileNameWarning(null);
  };

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const incrementCount = () => {
    setTags([...tags, { name: "" }]);
  };

  const decrementCount = () => {
    if (tags.length > 0) {
      setTags(tags.slice(0, tags.length - 1));
    }
  };

  const handleTagChange = (index, event) => {
    const newTags = [...tags];
    newTags[index].name = event.target.value;
    setTags(newTags);
  };

  const handleRemoveTag = (index) => {
    const newTags = [...tags];
    newTags.splice(index, 1);
    setTags(newTags);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("fileName", fileName);
    formData.append("sectionName", sectionName);
    formData.append("projectName", projectName);
    formData.append("oldFilePath", file.path_file);
    formData.append("tags", JSON.stringify(tags.map((tag) => tag.name)));

    console.log("FormData:", formData); // Inspecter formData
    console.log("fileId:", fileId); // Inspecter fileId
    console.log("projectName:", projectName);
    console.log("sectionName:", sectionName);
    console.log("fileName", fileName);
    console.log("file.path_file:", file.path_file);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/uploadFile/files/${fileId}`,
        {
          method: "PUT",
          body: formData,
        }
      );

      if (response.ok) {
        onFileUploaded();
        onCloseModalEditFile();
      } else {
        const errorData = await response.json();
        setServerErrors(errorData.errors);
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
          {projectName} / {sectionName} / {fileName}
        </p>
      </div>
      <div className="md:px-14 px-7">
        <ModalInputText
          label="File Name:"
          placeholder="Name file..."
          value={fileName}
          onChange={handleFileNameChange}
        />
        {fileNameWarning && (
          <p className="text-yellow-500 text-sm">{fileNameWarning}</p>
        )}
        <div className="mb-4">
          <label
            htmlFor="projectFile"
            className="block text-sm font-medium text-gray-700"
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
      </div>
      {/* Tag */}
      <div className="md:px-14 px-7">
        <div className="mt-5 flex items-center">
          <label className="me-4" htmlFor="tags">
            Tag Count:
          </label>
          <div className="flex items-center">
            <button
              type="button"
              onClick={decrementCount}
              className="bg-white/30 hover:bg-white/50 boder-white border-y border-s text-white font-bold px-3 py-1 rounded-s-xl"
            >
              -
            </button>
            <span className="px-3 py-1 border-white border-y">
              {tags.length}
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
          {tags.map((tag, index) => (
            <div key={index} className="my-2.5">
              <div className="flex items-center">
                <input
                  type="text"
                  placeholder="Tag name..."
                  value={tag.name}
                  onChange={(event) => handleTagChange(index, event)}
                  className={`block w-full rounded-xl bg-transparent px-3 py-1.5 text-base outline outline-1 -outline-offset-1 placeholder:text-white focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 ${
                    tag.error || (serverErrors && serverErrors[tag.name])
                      ? "border-red-500"
                      : ""
                  }`}
                />
                <button
                  type="button"
                  onClick={() => handleRemoveTag(index)}
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
              {(tag.error || (serverErrors && serverErrors[tag.name])) && (
                <div className="text-red-500 mt-1">
                  {tag.error && <p>{tag.error}</p>}
                  {!tag.error && serverErrors && serverErrors[tag.name] && (
                    <p>{serverErrors[tag.name]}</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      <ModalFooter name="Save" onClose={onCloseModalEditFile} />
    </form>
  );
}
