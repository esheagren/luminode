#!/bin/sh
# Runs the remaining experiments sequentially (each ~10-90 s). Output in results/*.json.
cd "$(dirname "$0")"
run() { echo "=== $*"; node run.js "$@" 2>&1 | grep -E '"(label|ok|error|totalMs|bytes|firstMs|warmMedianMs|wallMs|adapter|webgpuApi|usedJSHeapMB|hfBytes)"|ABORT|PAGEERROR' ; }
run --file model_probe --dtype fp32 --device wasm --source local --label probe-fp32-wasm --timeout 300000 --port 8771
run --file model_probe --dtype fp16 --device wasm --source local --label probe-fp16-wasm --timeout 300000 --port 8772
run --file decoder_model_merged --dtype q8 --device wasm --source local --label stock-q8-wasm --timeout 300000 --port 8773
run --file model_probe --dtype q8 --device webgpu --source local --label probe-q8-webgpu-shell --timeout 180000 --port 8774
run --file model_probe --dtype q8 --device webgpu --source local --label probe-q8-webgpu-full --browser full --timeout 180000 --port 8775
run --file model_probe --dtype fp16 --device webgpu --source local --label probe-fp16-webgpu-full --browser full --timeout 180000 --port 8776
run --file decoder_model_merged --dtype q8 --device wasm --source remote --label stock-q8-wasm-remote-cold --timeout 600000 --port 8777
echo "=== ALL DONE"
