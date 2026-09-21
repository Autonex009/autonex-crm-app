import { registerRootComponent } from "expo";

import App from "./App";

// registerRootComponent registers "main", which is the component name
// MainActivity.getMainComponentName() returns on Android.
registerRootComponent(App);
