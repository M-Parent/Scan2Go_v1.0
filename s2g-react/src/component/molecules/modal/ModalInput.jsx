export function ModalInput(props) {
  return (
    <div className="mt-3">
      <label className="block text-sm/6 " for={props.for}>
        {props.label}
      </label>
      <div className="mt-2">
        <input
          className="block w-full rounded-xl bg-transparent px-3 py-1.5 text-base outline outline-1 -outline-offset-1 placeholder:text-white focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
          type={props.type}
          name={props.for}
          placeholder={props.placeholder}
        />
      </div>
    </div>
  );
}
