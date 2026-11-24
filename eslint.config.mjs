import next from "eslint-config-next";

// eslint-config-next exporta un array de configs planos:
//   [ "next", "next/typescript", reglas varias ]
const config = [
  ...next,
  {
    ignores: [".next/**", "node_modules/**", "next-env.d.ts", "research/**"],
  },
];

export default config;
