// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { defineConfig } from 'file:///mnt/extra-ssd/jarek/dev/splice-wallet-kernel/.yarn/__virtual__/vite-virtual-28a4e6acbc/6/home/jarek/.yarn/berry/cache/vite-npm-7.3.2-20decd81df-10c0.zip/node_modules/vite/dist/node/index.js'
import dts from 'file:///mnt/extra-ssd/jarek/dev/splice-wallet-kernel/.yarn/__virtual__/vite-plugin-dts-virtual-dcaad0a523/6/home/jarek/.yarn/berry/cache/vite-plugin-dts-npm-4.5.4-2445647687-10c0.zip/node_modules/vite-plugin-dts/dist/index.mjs'
var vite_config_default = defineConfig({
    build: {
        emptyOutDir: false,
        lib: {
            entry: 'src/index.ts',
            formats: ['es', 'cjs'],
            fileName: (format) => (format === 'cjs' ? 'index.cjs' : 'index.js'),
            cssFileName: 'index',
        },
        rollupOptions: {
            external: ['lit', 'bootstrap', '@popperjs/core'],
            output: {
                exports: 'auto',
            },
        },
        sourcemap: true,
    },
    plugins: [dts()],
})
export { vite_config_default as default }
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlUm9vdCI6ICJmaWxlOi8vL21udC9leHRyYS1zc2QvamFyZWsvZGV2L3NwbGljZS13YWxsZXQta2VybmVsL2NvcmUvd2FsbGV0LXVpLWNvbXBvbmVudHMvIiwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvbW50L2V4dHJhLXNzZC9qYXJlay9kZXYvc3BsaWNlLXdhbGxldC1rZXJuZWwvY29yZS93YWxsZXQtdWktY29tcG9uZW50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL21udC9leHRyYS1zc2QvamFyZWsvZGV2L3NwbGljZS13YWxsZXQta2VybmVsL2NvcmUvd2FsbGV0LXVpLWNvbXBvbmVudHMvdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL21udC9leHRyYS1zc2QvamFyZWsvZGV2L3NwbGljZS13YWxsZXQta2VybmVsL2NvcmUvd2FsbGV0LXVpLWNvbXBvbmVudHMvdml0ZS5jb25maWcudHNcIjsvLyBDb3B5cmlnaHQgKGMpIDIwMjUtMjAyNiBEaWdpdGFsIEFzc2V0IChTd2l0emVybGFuZCkgR21iSCBhbmQvb3IgaXRzIGFmZmlsaWF0ZXMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4vLyBTUERYLUxpY2Vuc2UtSWRlbnRpZmllcjogQXBhY2hlLTIuMFxuXG5pbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJ1xuaW1wb3J0IGR0cyBmcm9tICd2aXRlLXBsdWdpbi1kdHMnXG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gICAgYnVpbGQ6IHtcbiAgICAgICAgZW1wdHlPdXREaXI6IGZhbHNlLFxuICAgICAgICBsaWI6IHtcbiAgICAgICAgICAgIGVudHJ5OiAnc3JjL2luZGV4LnRzJyxcbiAgICAgICAgICAgIGZvcm1hdHM6IFsnZXMnLCAnY2pzJ10sXG4gICAgICAgICAgICBmaWxlTmFtZTogKGZvcm1hdCkgPT4gKGZvcm1hdCA9PT0gJ2NqcycgPyAnaW5kZXguY2pzJyA6ICdpbmRleC5qcycpLFxuICAgICAgICAgICAgY3NzRmlsZU5hbWU6ICdpbmRleCcsXG4gICAgICAgIH0sXG4gICAgICAgIHJvbGx1cE9wdGlvbnM6IHtcbiAgICAgICAgICAgIGV4dGVybmFsOiBbJ2xpdCcsICdib290c3RyYXAnLCAnQHBvcHBlcmpzL2NvcmUnXSxcbiAgICAgICAgICAgIG91dHB1dDoge1xuICAgICAgICAgICAgICAgIGV4cG9ydHM6ICdhdXRvJyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIHNvdXJjZW1hcDogdHJ1ZSxcbiAgICB9LFxuICAgIHBsdWdpbnM6IFtkdHMoKV0sXG59KVxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUdBLFNBQVMsb0JBQW9CO0FBQzdCLE9BQU8sU0FBUztBQUVoQixJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUN4QixPQUFPO0FBQUEsSUFDSCxhQUFhO0FBQUEsSUFDYixLQUFLO0FBQUEsTUFDRCxPQUFPO0FBQUEsTUFDUCxTQUFTLENBQUMsTUFBTSxLQUFLO0FBQUEsTUFDckIsVUFBVSxDQUFDLFdBQVksV0FBVyxRQUFRLGNBQWM7QUFBQSxNQUN4RCxhQUFhO0FBQUEsSUFDakI7QUFBQSxJQUNBLGVBQWU7QUFBQSxNQUNYLFVBQVUsQ0FBQyxPQUFPLGFBQWEsZ0JBQWdCO0FBQUEsTUFDL0MsUUFBUTtBQUFBLFFBQ0osU0FBUztBQUFBLE1BQ2I7QUFBQSxJQUNKO0FBQUEsSUFDQSxXQUFXO0FBQUEsRUFDZjtBQUFBLEVBQ0EsU0FBUyxDQUFDLElBQUksQ0FBQztBQUNuQixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
