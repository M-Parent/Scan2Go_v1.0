export function ModalInputNumber(props) {
  return (
    <div className="flex mt-5">
      <label className="flex items-center me-4" for={props.for}>
        {props.label}
      </label>
      <div>
        <input
          className="w-14 rounded-xl bg-transparent px-3 py-1.5 text-base outline outline-1 -outline-offset-1 placeholder:text-white focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
          type="number"
          id={props.for}
          name={props.for}
          min={props.min}
          max={props.max}
          placeholder="1"
        />
      </div>
    </div>
  );
}
