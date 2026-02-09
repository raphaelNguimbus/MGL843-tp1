module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    transform: {
        '^.+\\.tsx?$': ['ts-jest', { isolatedModules: true }],
    },
    testMatch: ['**/?(*.)+(spec|test).[tj]s?(x)'],
    testPathIgnorePatterns: ['/node_modules/', '/dist/'],
    projects: [
        {
            displayName: 'backend',
            testEnvironment: 'node',
            testMatch: ['<rootDir>/tests/**/*.test.ts'],
            transform: {
                '^.+\\.tsx?$': ['ts-jest', { isolatedModules: true }],
            },
        },
        {
            displayName: 'frontend',
            testEnvironment: 'jsdom',
            testMatch: ['<rootDir>/tests/frontend/**/*.test.js'],
        },
    ],
};
