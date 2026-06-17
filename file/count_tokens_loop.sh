#!/bin/bash

for prefix in .claude .claude-person .claude-work; do
    for d in ~/"$prefix"/projects/*/; do
        if [ -d "$d" ]; then
            python3 ~/count_tokens.py "$d"
        fi
    done
done
