/// <reference types="expo/types" />

/**
 * EXPO_PUBLIC_* variables are inlined by the bundler at build time, the same
 * way Vite handles PUBLIC_* for the web app. Declared here rather than pulling
 * in @types/node, which would also bring Node's globals into a runtime that
 * does not have them.
 */
declare const process: {
  env: {
    EXPO_PUBLIC_API_URL?: string;
    NODE_ENV?: "development" | "production" | "test";
  };
};
