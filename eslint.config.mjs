import { defineConfig } from "eslint/config";
import { configs as typescriptConfigs } from "@typescript-eslint/eslint-plugin";

export default defineConfig({
	files: ["**/*.ts"],
	extends: [typescriptConfigs.recommended],
	rules: {
		"@typescript-eslint/no-explicit-any": "off",
		"@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
		"@typescript-eslint/naming-convention": [
			"warn",
			{
				selector: "import",
				format: ["camelCase", "PascalCase"],
			},
		],
		curly: "warn",
		eqeqeq: "warn",
		"no-throw-literal": "warn",
		semi: "warn",
	},
});
