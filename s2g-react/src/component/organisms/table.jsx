<div
  className={`mt-5 transition-all duration-300 ease-in-out overflow-x-auto ${
    isCollapsed[section.id] ? "hidden" : "" // Correctly use section.id here
  }`}
>
  <table className="w-full">
    <thead className="text-xs uppercase border-b">
      <tr>
        <td className="px-6 py-3">Name</td>
        <th scope="col" className="px-6 py-3 text-nowrap">
          QR Code
        </th>
        <th scope="col" className="px-6 py-3">
          Share
        </th>
        <th scope="col" className="px-6 py-3">
          Tag
        </th>
        <th scope="col" className="flex justify-end pe-4 sm:pe-10 py-3">
          Action
        </th>
      </tr>
    </thead>
    <tbody>
      <tr className="hover:border hover:bg-white/20 duration-300 transition ease-in-out">
        <td className="px-6 py-4 text-lg text-nowrap">File Name</td>
        <th className="px-6 py-4">
          <button>
            <img
              src="../img/icon/qr-code-scan.svg"
              alt="Qr Code File"
              width={24}
            />
          </button>
        </th>
        <th className="px-6 py-4">
          <button>
            <img src="../img/icon/share.svg" alt="Share File" width={24} />
          </button>
        </th>
        <th className="sm:flex sm:justify-center py-4">
          <div>
            <span className="Glassmorphgisme-noHover text-xs px-2 py-0.5 me-1.5">
              QGET
            </span>
          </div>
          <div>
            <span className="Glassmorphgisme-noHover text-xs px-2 me-1.5 py-0.5 text-nowrap">
              Comd Team
            </span>
          </div>
          <div>
            <span className="Glassmorphgisme-noHover text-xs px-2 py-0.5 text-nowrap">
              G6
            </span>
          </div>
        </th>
        <th className="px-1 sm:px-6 sm:py-4">
          <div className="flex justify-end ">
            <button>
              <img
                className="me-1"
                src="../img/icon/file-arrow-down.svg"
                alt="Download File"
                width={24}
              />
            </button>
            <button>
              <img
                className="me-1"
                src="../img/icon/pencil-square.svg"
                alt="Edit File"
                width={24}
              />
            </button>
            <button>
              <img src="../img/icon/trash.svg" alt="Delete File" width={24} />
            </button>
          </div>
        </th>
      </tr>
    </tbody>
  </table>
</div>;
