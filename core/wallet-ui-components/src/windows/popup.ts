// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { CSSResultGroup } from 'lit'

interface PopupOptions {
    title?: string
    target?: string
    width?: number
    height?: number
    screenX?: number
    screenY?: number
}

interface StyledElement {
    new (): HTMLElement
    styles: string | CSSResultGroup
}

let globalPopupInstance: WindowProxy | undefined

class PopupInstance {
    static getInstance() {
        if (!globalPopupInstance || globalPopupInstance.closed) {
            console.log('[PopupInstance] Creating new global popup instance')
            const win = window.open(
                '',
                'wallet-popup',
                `width=400,height=600,screenX=200,screenY=200`
            )
            if (!win) throw new Error('Failed to open popup window')
            globalPopupInstance = win
        }
        return globalPopupInstance
    }

    constructor() {
        // Use multiple event listeners for better cross-browser compatibility
        const closePopupOnUnload = () => {
            if (globalPopupInstance) {
                console.log('[PopupInstance] Closing popup instance on unload')
                globalPopupInstance.close()
                globalPopupInstance = undefined
            }
        }

        window.addEventListener('beforeunload', closePopupOnUnload)
        window.addEventListener('unload', closePopupOnUnload)
    }

    open(url: string | URL): WindowProxy
    open(component: StyledElement, options?: PopupOptions): WindowProxy
    open(
        urlOrComponent: string | URL | StyledElement,
        options?: PopupOptions
    ): WindowProxy {
        if (
            typeof urlOrComponent === 'string' ||
            urlOrComponent instanceof URL
        ) {
            const win = PopupInstance.getInstance()
            win.location.href = urlOrComponent.toString()
            win.focus()
            return win
        } else {
            const componentUrl = this.getComponentUrl(urlOrComponent, options)
            const win = PopupInstance.getInstance()
            win.location.href = componentUrl
            win.focus()
            return win
        }
    }

    close() {
        console.log('[PopupInstance] Closing popup instance')
        if (globalPopupInstance) globalPopupInstance.close()
    }

    private getComponentUrl(
        component: StyledElement,
        options?: PopupOptions
    ): string {
        const { title = 'Custom Popup' } = options || {}

        // Extract and safely escape styles for use in template literal within <script> tag
        const escapedStyles = this.escapeStylesForTemplate(
            component.styles.toString()
        )

        // Get serialized component and remove any static styles assignments
        // This prevents minification issues where identifiers get renamed
        let elementSource = component.toString()
        // Remove static styles field assignments to avoid runtime ReferenceErrors after minification
        elementSource = elementSource.replace(
            /static\s+styles\s*=\s*[^;]*;?/g,
            ''
        )

        const html = `<!DOCTYPE html>
    <html>
        <head>
            <title>${title}</title>
            <style>
                html, body {
                    margin: 0;
                    padding: 0;
                    width: 100%;
                    height: 100%;
                }

                body {
                    display: flex;
                }
            </style>
        </head>
        <body>
        </body>

        <script>
            const Component = (${elementSource});
            Component.styles = \`${escapedStyles}\`;

            customElements.define('popup-content', Component);

            const content = document.createElement('popup-content');
            content.style.width = '100%';
            content.style.height = '100%';

            document.body.appendChild(content)

            URL.revokeObjectURL(window.location.href)
        </script>
    </html>`

        return URL.createObjectURL(new Blob([html], { type: 'text/html' }))
    }

    private escapeStylesForTemplate(styles: string): string {
        // Escape CSS string for safe injection into a template literal within an HTML <script> tag.
        // Must escape in the correct order to avoid double-escaping.
        return styles
            .replaceAll('\\', '\\\\') // Escape backslashes first
            .replaceAll('`', '\\`') // Escape backticks (terminates template literal)
            .replaceAll('</', '<\\/') // Escape closing tags (prevents breaking inline script)
    }
}

export const popup = new PopupInstance()
