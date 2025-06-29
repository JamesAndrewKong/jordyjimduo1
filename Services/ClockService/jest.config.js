module.exports = {
    globals: {
        'ts-jest': {
            tsconfig: './tsconfig.json',
        },
    },
    setupFilesAfterEnv: [
        './tests/config/setup.js',
    ],
    testEnvironment: 'node',
    coveragePathIgnorePatterns: [
        '/node_modules/',
    ],
};
