import typescript from "rollup-plugin-typescript2";
import { terser } from "rollup-plugin-minification";

import pkg from "./package.json";
import peerDepsExternal from 'rollup-plugin-peer-deps-external';

export default {
  name: "prosemirror-codemirror-block",
  input: "src/index.ts",
  inlineDynamicImports: true,
  output: [
    {
      file: pkg.main,
      format: "cjs",
    },
    { file: pkg.module, format: "es" },
  ],
  external: [...Object.keys(pkg.peerDependenciesx || {})],
  plugins: [
    peerDepsExternal(),
    typescript(),
    terser(),
  ],
  sourcemap: true,
};
