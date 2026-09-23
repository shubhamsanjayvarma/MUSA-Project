# 🎨 General - Team Settings - Dashboard

> This document outlines the core design tokens and visual language for the project. Use these guidelines to ensure consistency across the application.

## 1. Colors

The color system is defined by scales from 50 (lightest) to 950 (darkest), alongside semantic colors for specific intents.

### Primary

| Shade | Hex | Token Variable |
|-------|-----|----------------|
| 50 | `#f7f7f8` | `--color-primary-50` |
| 100 | `#eeeff1` | `--color-primary-100` |
| 200 | `#d8dade` | `--color-primary-200` |
| 300 | `#bcc0c7` | `--color-primary-300` |
| 400 | `#959ba7` | `--color-primary-400` |
| 500 | `#6b7280` | `--color-primary-500` |
| 600 | `#626875` | `--color-primary-600` |
| 700 | `#4f545e` | `--color-primary-700` |
| 800 | `#3c4048` | `--color-primary-800` |
| 900 | `#2f3237` | `--color-primary-900` |
| 950 | `#1f2024` | `--color-primary-950` |

### Secondary

| Shade | Hex | Token Variable |
|-------|-----|----------------|
| 50 | `#f7f5fa` | `--color-secondary-50` |
| 100 | `#efebf4` | `--color-secondary-100` |
| 200 | `#d9d1e6` | `--color-secondary-200` |
| 300 | `#bdadd6` | `--color-secondary-300` |
| 400 | `#967cc0` | `--color-secondary-400` |
| 500 | `#7655aa` | `--color-secondary-500` |
| 600 | `#63478f` | `--color-secondary-600` |
| 700 | `#503a74` | `--color-secondary-700` |
| 800 | `#3d2c58` | `--color-secondary-800` |
| 900 | `#302541` | `--color-secondary-900` |
| 950 | `#211830` | `--color-secondary-950` |

### Accent

| Shade | Hex | Token Variable |
|-------|-----|----------------|
| 50 | `#fef9f1` | `--color-accent-50` |
| 100 | `#fcf3e3` | `--color-accent-100` |
| 200 | `#f9e2be` | `--color-accent-200` |
| 300 | `#facf8a` | `--color-accent-300` |
| 400 | `#fbb441` | `--color-accent-400` |
| 500 | `#f5a623` | `--color-accent-500` |
| 600 | `#cd8209` | `--color-accent-600` |
| 700 | `#a66908` | `--color-accent-700` |
| 800 | `#7f5006` | `--color-accent-800` |
| 900 | `#5b3c0b` | `--color-accent-900` |
| 950 | `#3b2707` | `--color-accent-950` |

### Neutral

| Shade | Hex | Token Variable |
|-------|-----|----------------|
| 50 | `#f7f7f7` | `--color-neutral-50` |
| 100 | `#ededed` | `--color-neutral-100` |
| 200 | `#dbdbdb` | `--color-neutral-200` |
| 300 | `#c2c2c2` | `--color-neutral-300` |
| 400 | `#9e9e9e` | `--color-neutral-400` |
| 500 | `#808080` | `--color-neutral-500` |
| 600 | `#6b6b6b` | `--color-neutral-600` |
| 700 | `#575757` | `--color-neutral-700` |
| 800 | `#424242` | `--color-neutral-800` |
| 900 | `#333333` | `--color-neutral-900` |
| 950 | `#212121` | `--color-neutral-950` |

### Semantic Intents

| Intent | Hex | Token Variable |
|--------|-----|----------------|
| Success | `#d3e5ff` | `--color-success` |
| Warning | `#f5a623` | `--color-warning` |
| Error   | `#f7d4d6` | `--color-error` |

## 2. Typography

### Font Families

- **Sans (Body):** `GeistSans, GeistSans Fallback`
- **Display (Headings):** `GeistSans`
- **Mono (Code):** `Geist Mono`

### Font Sizes

| Scale | Value | Token Variable |
|-------|-------|----------------|
| xs | `0.688rem` | `--font-size-xs` |
| base | `0.813rem` | `--font-size-base` |
| 2xl | `1rem` | `--font-size-2xl` |
| 4xl | `1.25rem` | `--font-size-4xl` |
| sm | `0.75rem` | `--font-size-sm` |
| lg | `0.875rem` | `--font-size-lg` |
| xl | `0.938rem` | `--font-size-xl` |
| 3xl | `1.125rem` | `--font-size-3xl` |

### Font Weights

| Name | Weight | Token Variable |
|------|--------|----------------|
| normal | `400` | `--font-weight-normal` |
| medium | `500` | `--font-weight-medium` |
| semibold | `600` | `--font-weight-semibold` |

## 3. Spacing & Sizing

| Scale | Value | Token Variable |
|-------|-------|----------------|
| 0 | `0` | `--spacing-0` |
| 1 | `0.125rem` | `--spacing-1` |
| 2 | `0.375rem` | `--spacing-2` |
| 3 | `0.625rem` | `--spacing-3` |
| 5 | `1.25rem` | `--spacing-5` |
| 6 | `1.5rem` | `--spacing-6` |
| 8 | `2rem` | `--spacing-8` |

## 4. Borders & Shadows

### Border Radius

| Name | Value | Token Variable |
|------|-------|----------------|
| none | `0` | `--radius-none` |
| sm | `0.25rem` | `--radius-sm` |
| md | `0.375rem` | `--radius-md` |
| lg | `0.5rem` | `--radius-lg` |
| xl | `0.75rem` | `--radius-xl` |
| 2xl | `1rem` | `--radius-2xl` |
| full | `9999px` | `--radius-full` |

### Shadows

| Name | Value | Token Variable |
|------|-------|----------------|
| sm | `rgba(255, 255, 255, 0.145) 0px 0px 0px 1px, rgb(0, 0, 0) 0px 0px 0px 1px` | `--shadow-sm` |
| md | `rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(255, 255, 255, 0.14) 0px 0px 0px 1px` | `--shadow-md` |
| lg | `rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.24) 0px 0px 3px -1px, rgba(0, 0, 0, 0.16) 0px 0px 0.5px 0px, rgba(0, 0, 0, 0.36) -0.5px 2px 3px -2px` | `--shadow-lg` |
| xl | `rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgb(46, 46, 46) 0px 0px 0px 1px` | `--shadow-xl` |
