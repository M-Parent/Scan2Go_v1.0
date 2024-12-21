//import title
import { TitleDivide } from "../component/atoms/TitleDivide";
//import Btn Atoms component
import { Card } from "../component/organisms/Card";

export function Organisms() {
  return (
    <div className="container mx-auto">
      {/* Title of the page*/}
      <div className="flex justify-center pb-2">
        <p className="text-2xl font-bold text-center">Organisms Components</p>
      </div>
      <TitleDivide title="Card" />
      <div className="my-8">
        <Card />
      </div>
      <TitleDivide title="Accordeon" />
    </div>
  );
}
