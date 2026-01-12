// @fun-land/fun-web - Web component library for fun-land

export type { Component, ElementChild } from "./types";
export type { FunState } from "./state";
export type { MountedComponent } from "./mount";
export type { KeyedChildren } from "./dom";

export { funState } from "./state";
export {
  h,
  text,
  attr,
  attrs,
  addClass,
  removeClass,
  toggleClass,
  append,
  on,
  bindProperty,
  keyedChildren,
  pipeEndo,
} from "./dom";
export { mount } from "./mount";
