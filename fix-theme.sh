#!/bin/bash
# Fix dark theme colors to wabi-sabi CSS variables

cd /Users/devl/clawd/projects/kato-dashboard/src

# Replace hardcoded dark backgrounds with CSS variables
find . -name "*.tsx" -exec sed -i '' \
  -e 's/bg-\[#111111\]/bg-[var(--bg-secondary)]/g' \
  -e 's/bg-\[#0a0a0a\]/bg-[var(--bg-primary)]/g' \
  -e 's/text-white/text-[var(--text-primary)]/g' \
  -e 's/text-gray-100/text-[var(--text-primary)]/g' \
  -e 's/text-gray-200/text-[var(--text-primary)]/g' \
  -e 's/text-gray-300/text-[var(--text-secondary)]/g' \
  -e 's/text-gray-400/text-[var(--text-secondary)]/g' \
  -e 's/text-gray-500/text-[var(--text-tertiary)]/g' \
  -e 's/text-gray-600/text-[var(--text-tertiary)]/g' \
  -e 's/border-white\/\[0\.06\]/border-[var(--border-subtle)]/g' \
  -e 's/border-white\/\[0\.1\]/border-[var(--border-medium)]/g' \
  -e 's/border-white\/\[0\.15\]/border-[var(--border-strong)]/g' \
  -e 's/bg-white\/\[0\.03\]/bg-[var(--bg-muted)]/g' \
  -e 's/bg-white\/\[0\.05\]/bg-[var(--bg-muted)]/g' \
  -e 's/bg-white\/\[0\.06\]/bg-[var(--bg-muted)]/g' \
  -e 's/bg-white\/\[0\.08\]/bg-[var(--bg-muted)]/g' \
  -e 's/hover:bg-white\/\[0\.03\]/hover:bg-[var(--bg-muted)]/g' \
  -e 's/hover:bg-white\/\[0\.05\]/hover:bg-[var(--bg-muted)]/g' \
  -e 's/hover:bg-white\/\[0\.06\]/hover:bg-[var(--bg-muted)]/g' \
  -e 's/hover:text-white/hover:text-[var(--text-primary)]/g' \
  -e 's/placeholder-gray-500/placeholder-[var(--text-muted)]/g' \
  -e 's/from-cyan-500/from-[var(--accent-primary)]/g' \
  -e 's/to-cyan-400/to-[var(--accent-primary-light)]/g' \
  -e 's/text-cyan-400/text-[var(--accent-primary)]/g' \
  -e 's/border-cyan-500/border-[var(--accent-primary)]/g' \
  -e 's/focus:border-cyan-500\/50/focus:border-[var(--accent-primary)]/g' \
  -e 's/ring-cyan-500\/20/ring-[var(--accent-primary)]/g' \
  -e 's/ring-violet-500\/50/ring-[var(--accent-primary)]/g' \
  -e 's/ring-offset-gray-950/ring-offset-[var(--bg-primary)]/g' \
  {} \;

echo "Theme colors updated to wabi-sabi CSS variables"
