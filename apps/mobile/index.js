// Entry point.
//
// A local file rather than expo's default "main": "node_modules/expo/AppEntry.js".
// Under pnpm that file lives deep inside the .pnpm store and reaches back out
// with a relative "../../App", which resolves to the wrong place. Registering
// the component here keeps the entry inside the project.
import { registerRootComponent } from "expo";

import App from "./App";

registerRootComponent(App);
