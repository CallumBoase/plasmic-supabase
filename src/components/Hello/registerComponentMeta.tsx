import { CodeComponentMeta } from "@plasmicapp/host";
import { HelloProps } from ".";

//Component metadata for registration in Plasmic
export const HelloMeta : CodeComponentMeta<HelloProps> = {
  name: "Hello",
  importPath: "./index",
  providesData: false,
  props: {},
}