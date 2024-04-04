import { resolve } from 'path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
    // root: resolve(__dirname, 'types'),
    build: {
        lib: {
            // Could also be a dictionary or array of multiple entry points
            entry: resolve(__dirname, 'src/index.ts'),
            name: 'redux-action-chain',
            // the proper extensions will be added
            fileName: 'index',
            formats: ['es']
        },
        outDir: resolve(__dirname, 'build'),
    },
    plugins: [dts({
        insertTypesEntry: true,
    })]
});