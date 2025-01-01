export function BtnPrimaryRounded(props) {
  return (
    <button className="bg-teal-500 hover:bg-teal-700 hover:shadow-md rounded-lg px-3 py-1.5 text-white font-bungee">
      {props.name}
    </button>
  );
}
