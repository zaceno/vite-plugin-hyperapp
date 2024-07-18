/*
  This type declaration is named 'jsx-runtime.d.tx' even though
  jsx is compiled in the classic way. It's only named this to make
  it easier for tsconfig.json to be ok with jsx in .tsx-files.
*/
import { Props } from "hyperapp"
declare global {
  module JSX {
    type IntrinsicElements = Record<string, Props<any>>
  }
}
