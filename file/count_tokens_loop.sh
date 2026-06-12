#!/bin/bash

for d in ~/.claude/projects/*/; do
    if [ -d "$d" ]; then
        python3 ~/count_tokens.py "$d"
    fi
done
