#!/bin/sh
# WebGPU follow-ups on the headless shell (which does get a Metal adapter with the flags in run.js).
cd "$(dirname "$0")"
run() { echo "=== $*"; node run.js "$@" 2>&1 | grep -E '"(label|ok|error|totalMs|firstMs|warmMedianMs|wallMs|usedJSHeapMB)"|top5|known|ABORT|PAGEERROR' ; }
run --file model_probe --dtype fp32 --device webgpu --source local --label probe-fp32-webgpu-shell --timeout 180000 --port 8781
run --file model_probe --dtype fp16 --device webgpu --source local --label probe-fp16-webgpu-shell --timeout 180000 --port 8782
run --file model --dtype fp16 --device webgpu --source local --label stock-fp16-webgpu-shell --timeout 180000 --port 8783
run --file model --dtype fp32 --device webgpu --source local --label stock-fp32-webgpu-shell --timeout 180000 --port 8784
echo "=== ALL DONE"
