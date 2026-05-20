#!/usr/bin/env node

// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

// generateOutputDocs.js
//
// - Reads a single export config: docs/config/exportConfig.json
// - Writes extracted snippets into: docs-output/<snippetName>.mdx
// - Resolves source files relative to the repo root

import fs from 'fs'
import path from 'path'

const REPO_ROOT = path.join(__dirname, '..', '..')
const EXPORT_CONFIG_PATH = path.join(REPO_ROOT, 'docs/config/exportConfig.json')
const OUTPUT_FOLDER_PATH = path.join(REPO_ROOT, 'docs-output')

function readFileContent(filePath) {
    try {
        return fs.readFileSync(filePath, 'utf8')
    } catch (error) {
        throw new Error(`Failed to read file ${filePath}: ${error.message}`, {
            cause: error,
        })
    }
}

function extractByLines(fileContent, start, end) {
    const lines = fileContent.split(/\r?\n/)
    const startLine = Number(start)
    const endLine = Number(end)

    if (
        startLine < 1 ||
        endLine < 1 ||
        startLine > lines.length ||
        endLine > lines.length
    ) {
        throw new Error(
            `Line numbers out of range: start=${startLine}, end=${endLine}, file has ${lines.length} lines`
        )
    }

    if (startLine > endLine) {
        throw new Error(
            `Invalid line range: start (${startLine}) must be <= end (${endLine})`
        )
    }

    return lines.slice(startLine - 1, endLine).join('\n')
}

function extractByStringMarker(fileContent, startMarker, endMarker) {
    const startIndex = fileContent.indexOf(startMarker)
    if (startIndex === -1) {
        throw new Error(`Start marker not found: "${startMarker}"`)
    }

    const contentStart = startIndex + startMarker.length
    const endIndex = fileContent.indexOf(endMarker, contentStart)
    if (endIndex === -1) {
        throw new Error(`End marker not found: "${endMarker}"`)
    }

    return fileContent.substring(contentStart, endIndex).trim()
}

function extractByRegexWrap(fileContent, startRegex, endRegex) {
    const startPattern = new RegExp(startRegex)
    const endPattern = new RegExp(endRegex)

    const startMatch = fileContent.match(startPattern)
    if (!startMatch) {
        throw new Error(`Start regex pattern not found: "${startRegex}"`)
    }

    const contentStart = startMatch.index + startMatch[0].length
    const remainingContent = fileContent.substring(contentStart)
    const endMatch = remainingContent.match(endPattern)

    if (!endMatch) {
        throw new Error(`End regex pattern not found: "${endRegex}"`)
    }

    return remainingContent.substring(0, endMatch.index).trim()
}

function extractByJsonIndex(fileContent, start, end) {
    let arr
    try {
        arr = JSON.parse(fileContent)
    } catch (e) {
        throw new Error(`File is not valid JSON: ${e.message}`, {
            cause: e,
        })
    }
    if (!Array.isArray(arr)) {
        throw new Error(
            'JSON root must be an array for location type jsonIndex'
        )
    }
    const startIdx = Number(start)
    const endIdx = Number(end)
    if (
        startIdx < 0 ||
        endIdx < 0 ||
        startIdx >= arr.length ||
        endIdx >= arr.length
    ) {
        throw new Error(
            `Array index out of range: start=${startIdx}, end=${endIdx}, array length=${arr.length}`
        )
    }
    if (startIdx > endIdx) {
        throw new Error(
            `Invalid index range: start (${startIdx}) must be <= end (${endIdx})`
        )
    }
    if (startIdx === endIdx) {
        const item = arr[startIdx]
        return typeof item === 'string' ? item : String(item)
    }
    return arr
        .slice(startIdx, endIdx + 1)
        .map((item) => (typeof item === 'string' ? item : String(item)))
        .join('\n')
}

function extractSnippetContent(fileContent, location) {
    switch (location.type) {
        case 'fullFile':
            return fileContent

        case 'lines':
            return extractByLines(fileContent, location.start, location.end)

        case 'jsonIndex':
            return extractByJsonIndex(fileContent, location.start, location.end)

        case 'stringMarker':
            return extractByStringMarker(
                fileContent,
                location.start,
                location.end
            )

        case 'regexWrap':
            return extractByRegexWrap(fileContent, location.start, location.end)

        default:
            throw new Error(`Unknown location type: ${location.type}`)
    }
}

function normalizeIndent(content) {
    const lines = content.split('\n')

    let minIndent = null
    for (const line of lines) {
        if (line.trim() === '') continue
        const match = line.match(/^(\s*)/)
        const indent = match ? match[1].length : 0
        if (minIndent === null || indent < minIndent) {
            minIndent = indent
        }
    }

    if (minIndent === null || minIndent === 0) {
        return lines
            .map((line) =>
                line.trim() === '' ? '' : `  ${line.replace(/^\s*/, '')}`
            )
            .join('\n')
    }

    return lines
        .map((line) => {
            if (line.trim() === '') return ''
            return `  ${line.slice(minIndent)}`
        })
        .join('\n')
}

function formatSnippetContent(content, options) {
    if (options && options.transform === 'rstjson') {
        return content
    }
    const displayStyle = (options && options.displayStyle) || 'wrapCode'
    const rawLanguage = options && options.language ? options.language : ''
    const language =
        rawLanguage && rawLanguage.toLowerCase() === 'none' ? '' : rawLanguage

    switch (displayStyle) {
        case 'wrapCode':
            if (language) {
                return `\`\`\`${language}\n${content}\n\`\`\``
            } else {
                return `\`\`\`\n${content}\n\`\`\``
            }

        default:
            return content
    }
}

function getSourceFilePath(snippet) {
    if (snippet.sourceFilepath) {
        return path.join(REPO_ROOT, snippet.sourceFilepath)
    } else {
        throw new Error(
            `Snippet "${snippet.snippetName}" has no source file path specified`
        )
    }
}

function processSnippet(snippet) {
    try {
        console.log(`Processing snippet: ${snippet.snippetName}`)

        if (!snippet.snippetName) {
            throw new Error('Snippet missing required field: snippetName')
        }

        if (!snippet.location) {
            throw new Error(
                `Snippet "${snippet.snippetName}" missing required field: location`
            )
        }

        const sourceFilePath = getSourceFilePath(snippet)

        const fileContent = readFileContent(sourceFilePath)

        const extractedContent = extractSnippetContent(
            fileContent,
            snippet.location
        )
        const normalizedContent =
            snippet.options && snippet.options.transform === 'rstjson'
                ? extractedContent
                : normalizeIndent(extractedContent)

        const formattedContent = formatSnippetContent(
            normalizedContent,
            snippet.options || {}
        )

        const outputFileName = `${snippet.snippetName}.mdx`
        const outputPath = path.join(OUTPUT_FOLDER_PATH, outputFileName)
        const outputPathDir = path.dirname(outputPath)

        fs.mkdirSync(outputPathDir, { recursive: true })

        fs.writeFileSync(outputPath, formattedContent, 'utf8')

        console.log(`✓ Successfully extracted snippet to: ${outputPath}`)
    } catch (error) {
        console.error(
            `✗ Error processing snippet "${snippet.snippetName}": ${error.message}`
        )
        throw error
    }
}

/**
 * Main function
 * Reads docs/config/exportConfig.json and processes each snippet.
 */
function main() {
    try {
        const configContent = readFileContent(EXPORT_CONFIG_PATH)
        const config = JSON.parse(configContent)

        if (!config.snippets || !Array.isArray(config.snippets)) {
            throw new Error(
                'exportConfig.json must have a top-level "snippets" array'
            )
        }

        let successCount = 0
        let errorCount = 0

        for (const snippet of config.snippets) {
            try {
                processSnippet(snippet)
                successCount++
            } catch {
                errorCount++
            }
        }

        console.log(
            `\nProcessing complete: ${successCount} succeeded, ${errorCount} failed`
        )

        if (errorCount > 0) {
            process.exit(1)
        }
    } catch (error) {
        console.error(`Fatal error: ${error.message}`)
        process.exit(1)
    }
}

main()
