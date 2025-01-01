export function SearchBarGlass() {
  return (
    <form>
      <div className="flex justify-center">
        <div className="relative">
          <input
            className=" sm:w-96 w-72 mx-auto rounded-full bg-white/30 px-3 py-1.5 text-base border-white border text-white placeholder:text-white/70 focus:outline focus:outline-2  focus:-outline-offset-1 focus:outline-indigo-600 sm:text-sm/6"
            type="text"
            id="search-bar"
            name="search-bar"
            placeholder="Search bar... "
            required
          />
          <button type="submit">
            <img
              className="absolute top-[5px] right-[5px] bg-white/30 rounded-full px-3 py-1.5"
              src="../img/icon/search.svg"
            />
          </button>
        </div>
      </div>
    </form>
  );
}
