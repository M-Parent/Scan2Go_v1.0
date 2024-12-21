//import Btn Atoms component
import { BtnPrimary } from "../component/atoms/BtnPrimary";
import { BtnSecondary } from "../component/atoms/BtnSecondary";
import { BtnPrimaryRounded } from "../component/atoms/BtnPrimaryRounded";
import { BtnSecondaryRounded } from "../component/atoms/BtnSecondaryRounded";
import { BtnPrimaryPill } from "../component/atoms/BtnPrimaryPill";
import { BtnSecondaryPill } from "../component/atoms/BtnSecondaryPill";
//import title
import { TitleDivide } from "../component/atoms/TitleDivide";
export function Atoms() {
  return (
    <div className="container mx-auto">
      {/* Title of the page*/}
      <div className="flex justify-center pb-2">
        <p className="text-2xl font-bold text-center">Atoms Components</p>
      </div>
      {/* TitleDivide Button Section*/}
      <TitleDivide title="Button" />
      <div className="grid lg:grid-cols-6 md:grid-cols-4 gap-x-4 gap-y-4 my-8">
        <BtnPrimary name="Click Here" />
        <BtnSecondary name="Click Here" />
        <BtnPrimaryRounded name="Click Here" />
        <BtnSecondaryRounded name="Click Here" />
        <BtnPrimaryPill name="Click Here" />
        <BtnSecondaryPill name="Click Here" />
      </div>
      {/* TitleDivide  */}
      <TitleDivide title="Test" />
    </div>
  );
}
