// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { css } from 'lit'

export default css`
    * {
        box-sizing: border-box;
        font-family: var(--wg-theme-font-family);
        color: var(--wg-theme-text-color);
    }

    .root {
        background-color: var(--wg-theme-background-color);
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
    }

    .view-container {
        display: flex;
        flex-direction: column;
        height: 100%;
    }

    .header {
        height: 40px;
        padding: 0 24px;
        display: flex;
        align-items: center;
        border-bottom: 1px solid var(--wg-theme-border-color);
    }

    .header-logo {
        width: 28px;
        height: 28px;
    }

    .view-title {
        font-size: 20px;
        font-weight: 600;
        padding: 16px 24px 12px;
        color: var(--wg-theme-text-color);
    }

    .view-title-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 16px 24px 12px;
    }

    .view-title-row .view-title {
        padding: 0;
    }

    .back-link {
        border: none;
        background: transparent;
        padding: 0;
        color: var(--wg-theme-text-color);
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-size: 14px;
        font-weight: 400;
        line-height: 1;
        cursor: pointer;
        white-space: nowrap;
    }

    .back-link:hover {
        color: var(--wg-theme-text-color);
    }

    .back-link:focus-visible {
        outline: 2px solid var(--wg-theme-accent-color);
        outline-offset: 2px;
        border-radius: 4px;
    }

    .back-link .icon {
        display: inline-flex;
        align-items: center;
    }

    .back-link svg {
        width: 10px;
        height: 10px;
    }

    .wallet-list {
        flex: 1;
        overflow-y: auto;
        padding: 4px 12px 0;
    }

    .wallet-card {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 14px 16px;
        border-radius: 8px;
        border: 1px solid var(--wg-theme-border-color);
        background: var(--wg-theme-surface-color);
        cursor: pointer;
        transition: all 0.15s ease;
        width: 100%;
        text-align: left;
        margin-bottom: 8px;
    }

    .wallet-card:hover {
        background: var(--wg-theme-surface-hover);
        border-color: var(--wg-theme-accent-color);
    }

    .wallet-card:focus-visible {
        outline: 2px solid var(--wg-theme-accent-color);
        outline-offset: 2px;
    }

    .wallet-card:active {
        transform: scale(0.99);
    }

    .wallet-icon {
        width: 32px;
        height: 32px;
        border-radius: 8px;
        background: var(--wg-theme-icon-bg);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        overflow: hidden;
    }

    .wallet-icon img {
        width: 32px;
        height: 32px;
        border-radius: 8px;
        object-fit: cover;
    }

    .wallet-icon svg {
        width: 22px;
        height: 22px;
        color: var(--wg-theme-text-secondary);
    }

    .wallet-name {
        flex: 1;
        min-width: 0;
        font-size: 15px;
        font-weight: 500;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .wallet-remove-btn {
        border: none;
        background: transparent;
        color: var(--wg-theme-text-secondary);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: color 0.15s ease;
        flex-shrink: 0;
        padding: 0;
        width: 16px;
        height: 16px;
    }

    .wallet-remove-btn:hover {
        color: var(--wg-theme-error-color);
    }

    .wallet-remove-btn:focus-visible {
        outline: 2px solid var(--wg-theme-accent-color);
        outline-offset: 4px;
        border-radius: 4px;
    }

    .wallet-remove-btn svg {
        width: 16px;
        height: 16px;
    }

    .custom-url-section {
        padding: 8px 12px 16px;
    }

    .custom-url-label {
        position: relative;
        display: flex;
        align-items: center;
        gap: 6px;
        width: 100%;
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--wg-theme-text-color);
        padding: 0 4px 8px;
    }

    .custom-url-label .info-wrap {
        display: inline-flex;
        align-items: center;
    }

    .custom-url-label .info-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 14px;
        height: 14px;
        color: var(--wg-theme-text-secondary);
        border: none;
        background: transparent;
        padding: 0;
        cursor: pointer;
    }

    .custom-url-label .info-icon:focus-visible {
        outline: 2px solid var(--wg-theme-accent-color);
        border-radius: 999px;
    }

    .custom-url-label .info-tooltip {
        position: absolute;
        bottom: calc(100% + 8px);
        left: 50%;
        transform: translateX(-50%);
        z-index: 20;
        width: max-content;
        max-width: min(320px, 90vw);
        padding: 8px 10px;
        border: none;
        border-radius: 10px;
        background: var(--wg-theme-primary-color);
        color: var(--wg-theme-primary-text-color);
        box-shadow: 0 10px 24px rgba(15, 23, 42, 0.22);
        font-size: 12px;
        font-weight: 500;
        line-height: 1.4;
        text-transform: none;
        letter-spacing: normal;
        white-space: normal;
        opacity: 0;
        visibility: hidden;
        pointer-events: none;
        transition: opacity 0.12s ease;
    }

    .custom-url-label .info-wrap:hover .info-tooltip {
        opacity: 1;
        visibility: visible;
    }

    .custom-url-row {
        display: flex;
        gap: 8px;
        align-items: center;
    }

    .custom-url-input {
        flex: 1;
        padding: 10px 14px;
        border: 1px solid var(--wg-theme-border-color);
        border-radius: 8px;
        font-size: 14px;
        outline: none;
        background: var(--wg-theme-surface-color);
        color: var(--wg-theme-text-color);
    }

    .custom-url-input:focus {
        border-color: var(--wg-theme-accent-color);
        box-shadow: 0 0 0 2px rgba(124, 58, 237, 0.15);
    }

    .custom-url-input::placeholder {
        color: var(--wg-theme-text-secondary);
    }

    .btn-add {
        background: var(--wg-theme-primary-color);
        color: var(--wg-theme-primary-text-color);
        border: none;
        border-radius: 20px;
        padding: 10px 24px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: background 0.15s;
        white-space: nowrap;
    }

    .btn-add:hover {
        background: var(--wg-theme-primary-hover);
    }

    .btn-add:disabled {
        opacity: 0.5;
        cursor: default;
    }

    .status-view {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 48px 24px;
        gap: 16px;
        text-align: center;
        flex: 1;
    }

    .status-view h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
    }

    .status-view p {
        margin: 0;
        font-size: 14px;
        color: var(--wg-theme-text-secondary);
    }

    .spinner {
        width: 36px;
        height: 36px;
        border: 3px solid var(--wg-theme-border-color);
        border-top-color: var(--wg-theme-accent-color);
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }

    .success-icon {
        color: var(--wg-theme-success-color);
    }

    .error-icon {
        color: var(--wg-theme-error-color);
    }

    .btn-row {
        display: flex;
        gap: 8px;
        margin-top: 8px;
    }

    .btn-primary {
        background: var(--wg-theme-primary-color);
        color: var(--wg-theme-primary-text-color);
        border: none;
        border-radius: 8px;
        padding: 10px 24px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: background 0.15s;
    }

    .btn-primary:hover {
        background: var(--wg-theme-primary-hover);
    }

    .btn-secondary {
        background: transparent;
        color: var(--wg-theme-text-secondary);
        border: 1px solid var(--wg-theme-border-color);
        border-radius: 8px;
        padding: 10px 24px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
    }

    .empty-state {
        color: var(--wg-theme-text-secondary);
    }
`
