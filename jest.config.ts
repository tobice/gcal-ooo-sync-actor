module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testPathIgnorePatterns: ['/node_modules/', '/dist/'],
    transform: {
        // Using swc as the default transformer is painfully slow.
        //
        // More context:
        // https://stackoverflow.com/questions/68724389/jest-takes-10s-to-run-two-trivial-typescript-tests-how-do-i-determine-why-its#comment137600249_75442408
        // https://github.com/kulshekhar/ts-jest/issues/4198
        '^.+\\.(t|j)sx?$': '@swc/jest',
    },
    moduleNameMapper: {
        // Required for NodeNext. Otherwise, Jest will not be able to resolve imports.
        //
        // More context:
        // https://stackoverflow.com/questions/73735202/typescript-jest-imports-with-js-extension-cause-error-cannot-find-module
        '^(\\.\\.?\\/.+)\\.js$': '$1',
    },
};
