module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    transform: {
        '^.+\\.tsx?$': ['ts-jest', { isolatedModules: true }],
    },
    testMatch: ['**/?(*.)+(spec|test).ts?(x)'],
    testPathIgnorePatterns: ['/node_modules/', '/dist/'],
};
