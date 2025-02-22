import React, { useState, useEffect } from "react";
import { ModalTitle } from "./ModalTitle";
import { ModalFooter } from "./ModalFooter";
import { ModalInputText } from "./ModalInputText";
import API_BASE_URL from "../../../api";

export function ModalAddFile({
  id,
  onCloseModalAddFile,
  sectionName,
  projectName,
  onFileUploaded,
}) {
  const [fileName, setFileName] = useState("");
  const [file, setFile] = useState(null);
  const [fileNameWarning, setFileNameWarning] = useState("");
  const [tags, setTags] = useState([{ name: "", error: "" }]); // State pour les tags
  const [errors, setErrors] = useState({});
  const [serverErrors, setServerErrors] = useState({});

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  useEffect(() => {
    if (!fileName) {
      setFileNameWarning("");
      return;
    }

    const checkFileNameExists = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/uploadFile/checkFileName?projectName=${projectName}&fileName=${fileName}`
        );
        const data = await response.json();
        if (data.exists) {
          setFileNameWarning(
            "Attention : Un fichier avec ce nom existe déjà dans une section de ce project."
          );
        } else {
          setFileNameWarning("");
        }
      } catch (error) {
        console.error(
          "Erreur lors de la vérification du nom de fichier :",
          error
        );
      }
    };

    const timeoutId = setTimeout(checkFileNameExists, 100);
    return () => clearTimeout(timeoutId);
  }, [fileName, projectName, sectionName]);

  const handleFileNameChange = (e) => {
    setFileName(e.target.value);
  };

  const handleTagChange = (index, event) => {
    const newTags = [...tags];
    newTags[index].name = event.target.value;

    const newErrors = { ...errors };

    for (let i = 0; i < newTags.length; i++) {
      if (
        newTags[i].name &&
        newTags.filter((item) => item.name === newTags[i].name).length > 1
      ) {
        newErrors[newTags[i].name] = "Duplicate tag name.";
        newTags[i].error = "Duplicate tag name.";
      } else {
        delete newErrors[newTags[i].name];
        newTags[i].error = "";
      }
    }

    setTags(newTags);
    setErrors(newErrors);
    setServerErrors({});
  };

  const handleAddTag = () => {
    if (tags.length < 5) {
      setTags([...tags, { name: "", error: "" }]);
    }
  };

  const handleRemoveTag = (index) => {
    const newTags = tags.filter((_, i) => i !== index);
    setTags(newTags);
    setErrors({});
  };

  const incrementCount = () => {
    handleAddTag();
  };

  const decrementCount = () => {
    if (tags.length > 1) {
      handleRemoveTag(tags.length - 1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      alert("Veuillez sélectionner un fichier.");
      return;
    }

    const formData = new FormData();
    formData.append("projectName", projectName);
    formData.append("sectionName", sectionName);
    formData.append("fileName", fileName);
    formData.append("file", file);

    tags.forEach((tag) => {
      if (tag.name) {
        formData.append("tags[]", tag.name);
      }
    });

    try {
      const response = await fetch(`${API_BASE_URL}/api/uploadFile/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.errors) {
          setServerErrors(errorData.errors);
          for (const key in errorData.errors) {
            const index = tags.findIndex((tag) => tag.name === key);
            if (index !== -1) {
              const newTags = [...tags];
              newTags[index].error = errorData.errors[key];
              setTags(newTags);
            }
          }
        } else {
          throw new Error(
            errorData.message || "Erreur lors du téléchargement du fichier."
          );
        }
      } else {
        alert("Fichier téléchargé avec succès !");
        onFileUploaded();
        onCloseModalAddFile();
      }
    } catch (error) {
      console.error("Erreur lors de la requête :", error);
      alert("Une erreur s'est produite lors du téléchargement.");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <ModalTitle title="Upload File" onClose={onCloseModalAddFile} />
      <div className="flex justify-center pt-3 ">
        <p className="font-bold text-lg">
          {projectName} / {sectionName} /
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
          <label className="me-4" htmlFor={id}>
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
      <ModalFooter name="ADD" onClose={onCloseModalAddFile} />
    </form>
  );
}
