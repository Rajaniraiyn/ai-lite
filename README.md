# ai-lite

A minimal patch set over Vercel’s AI SDK to remove the default ai-sdk/gateway provider and make model selection explicit.

## Why

The upstream SDK bundles a default gateway provider. This fork keeps the SDK behavior explicit: no implicit provider, no string shortcuts.

## What the patches do

- Remove the gateway provider as the default.
- Require explicit provider configuration when using `generateText` and related APIs.
- Reduce bundle size by dropping zod/v3 imports in favor of zod/v4
- Roughly ~100 KB smaller than upstream in our current build (varies by target/bundler).

## How it works

This repo stores ordered patch files in `patches/` and a small set of scripts to:

- clone the upstream repo at a pinned commit,
- apply patches in order,
- regenerate patches when edits are needed.
