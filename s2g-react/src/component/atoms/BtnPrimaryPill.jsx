export function BtnPrimaryPill(props) {
  return (
    <button className="bg-red-500 hover:bg-red-700 hover:shadow-md rounded-full px-2.5 py-1.5 text-white">
      {props.name}
    </button>
  );
}
