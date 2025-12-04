import type { ComponentType } from "svelte";

declare module "*.svelte" {
  const component: ComponentType;
  export default component;
}
