export function BtnPrimary(props) {
  return (
    <>
      <button className="bg-sky-500 hover:bg-sky-700 hover:shadow-md px-2.5 py-1.5 text-white">
        {props.name}
      </button>
    </>
  );
}
