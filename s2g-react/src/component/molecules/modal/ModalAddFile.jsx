import React from "react";
import { ModalTitle } from "./ModalTitle";
import { ModalFooter } from "./ModalFooter";
import { ModalInputText } from "./ModalInputText";
import { ModalInputFile } from "./ModalInputFile";

export function ModalAddFile({ id, onCloseModalAddFile }) {
  return (
    <form>
      <ModalTitle title="Upload File" onClose={onCloseModalAddFile} />
      <div className="flex justify-center pt-3 ">
        <p>
          Section /<span className="font-bold text-lg"> SectionName</span>
        </p>
      </div>
      <div className="md:px-14 px-7">
        <ModalInputText label="File Name:" placeholder="Server, Network..." />
        <ModalInputFile label="Upload File:" for="projectImage" />
        <div className="mt-5 flex items-center">
          <label className="me-4" htmlFor={id}>
            Tag Count:
          </label>
          <div className="flex items-center">
            <button
              type="button"
              className="bg-white/30 hover:bg-white/50 boder-white border-y border-s text-white font-bold px-3 py-1 rounded-s-xl"
            >
              -
            </button>
            <span className="px-3 py-1 border-white border-y">2</span>
            <button
              type="button"
              className="bg-white/30 hover:bg-white/50 boder-white border-y border-e text-white font-bold px-3 py-1 rounded-e-xl"
            >
              +
            </button>
          </div>
        </div>
        <div className="overflow-auto h-24 scrollbar-custom mt-1 pe-6">
          <div className="my-2.5">
            <div className="flex items-center">
              <input
                type="text"
                placeholder="Tag name..."
                className="block w-full rounded-xl bg-transparent px-3 py-1.5 text-base outline outline-1 -outline-offset-1 placeholder:text-white focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
              />
              <button type="button" className="text-red-500 ml-2">
                <div className="bg-white/20 hover:bg-red-700 boder-white border p-1.5 rounded-lg">
                  <img
                    src="../../../img/icon/trash.svg"
                    width={28}
                    alt="Trash-Can"
                  />
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="md:px-14 px-7">
        <p>Tag:</p>
        <div className="flex items-center mt-3">
          <input
            type="checkbox"
            name=""
            id=""
            className="appearance-none w-4 h-4 border-2 border-white rounded-md cursor-pointer checked:bg-indigo-600"
          />
          <label className="ps-1.5">Tagname</label>
        </div>
      </div>
      <ModalFooter name="ADD" onClose={onCloseModalAddFile} />
    </form>
  );
}
