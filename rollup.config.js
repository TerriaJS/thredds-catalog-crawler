import commonjs from 'rollup-plugin-commonjs'
import resolve from 'rollup-plugin-node-resolve'
import json from 'rollup-plugin-json'
import { terser } from 'rollup-plugin-terser'

const output = (outputName, plugins) => ({
    input: './src/main.js',
    output: {
        name: 'threddsCrawler',
        file: outputName,
        format: 'umd',
        exports: 'default'
    },
    plugins
})

export default [
    output('./dist/threddsCrawler.js', [
        json(),
        commonjs(),
        resolve()
    ]),
    output('./dist/threddsCrawler.min.js', [
        json(),
        commonjs(),
        resolve(),
        terser()
    ])
]
