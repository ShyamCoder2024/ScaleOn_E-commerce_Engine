module.exports = {
    root: true,
    env: { browser: true, es2020: true },
    extends: [
        'eslint:recommended',
        'plugin:react/recommended',
        'plugin:react/jsx-runtime',
        'plugin:react-hooks/recommended',
    ],
    ignorePatterns: ['dist', '.eslintrc.cjs'],
    parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
    settings: { react: { version: '18.2' } },
    plugins: ['react-refresh', 'react-hooks'],
    rules: {
        'react/jsx-no-target-blank': 'off',
        'react-refresh/only-export-components': 'off',
        'react/prop-types': 'off', // Common to disable in rapid prototyping
        'react/no-unescaped-entities': 'off',
        'react-hooks/exhaustive-deps': 'off',
        'no-unused-vars': 'off'
    },
}
