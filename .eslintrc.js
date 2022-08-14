module.exports = {
	parser: '@typescript-eslint/parser', // Specifies the ESLint parser
	parserOptions: {
		ecmaVersion: 2020, // Allows for the parsing of modern ECMAScript features
		sourceType: 'module', // Allows for the use of imports
		ecmaFeatures: {
			jsx: true, // Allows for the parsing of JSX
		},
	},
	settings: {
		react: {
			version: 'detect', // Tells eslint-plugin-react to automatically detect the version of React to use
		},
	},
	extends: [
		'plugin:security/recommended',
		'plugin:react/recommended', // Uses the recommended rules from @eslint-plugin-react
		'plugin:react-hooks/recommended',
		'plugin:@typescript-eslint/recommended', // Uses the recommended rules from @typescript-eslint/eslint-plugin
		'plugin:prettier/recommended', // Enables eslint-plugin-prettier and eslint-config-prettier. This will display prettier errors as ESLint errors. Make sure this is always the last configuration in the extends array.
	],
	rules: {
		// Place to specify ESLint rules. Can be used to overwrite rules specified from the extended configs
		// e.g. "@typescript-eslint/explicit-function-return-type": "off",
		'security/detect-non-literal-fs-filename': 0,
		'security/detect-object-injection': 0,
		'react/prop-types': 0,
		'@typescript-eslint/explicit-module-boundary-types': 0,
	},
};
