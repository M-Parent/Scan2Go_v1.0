# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)

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
    formData.append("file");
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
{/_ Tag _/}
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
            > -
</button>
<span className="px-3 py-1 border-white border-y">
{tags.length}
</span>
<button
              type="button"
              onClick={incrementCount}
              className="bg-white/30 hover:bg-white/50 boder-white border-y border-e text-white font-bold px-3 py-1 rounded-e-xl"
            > +
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
