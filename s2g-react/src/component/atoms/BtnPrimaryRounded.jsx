export function BtnPrimaryRounded(props) {
  return (
    <button className="bg-green-500 hover:bg-green-700 hover:shadow-md rounded px-2.5 py-1.5 text-white">
      {props.name}
    </button>
  );
}
