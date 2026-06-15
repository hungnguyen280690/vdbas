#!/bin/bash

# Lấy thư mục chứa script này
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

for d in ~/.claude/projects/*/; do
    if [ -d "$d" ]; then
        python3 "$SCRIPT_DIR/count_tokens.py" "$d"
    fi
done
