"""Run a probe graph in onnxruntime (CPU) and check the extra outputs are sane.
Usage: python validate_probe.py <model.onnx>"""
import sys, time
import numpy as np
import onnxruntime as ort

s = ort.InferenceSession(sys.argv[1], providers=["CPUExecutionProvider"])
in_types = {i.name: i.type for i in s.get_inputs()}
kv_dtype = np.float16 if "float16" in in_types.get("past_key_values.0.key", "") else np.float32
ids = np.array([[464, 412, 733, 417, 8765, 318, 287, 262, 1748, 286]], dtype=np.int64)
feed = {"input_ids": ids, "attention_mask": np.ones_like(ids), "use_cache_branch": np.array([False])}
for i in range(12):
    feed[f"past_key_values.{i}.key"] = np.zeros((1, 12, 0, 64), kv_dtype)
    feed[f"past_key_values.{i}.value"] = np.zeros((1, 12, 0, 64), kv_dtype)
feed = {k: v for k, v in feed.items() if k in in_types}
t = time.time(); outs = s.run(None, feed); ms = round((time.time() - t) * 1000)
d = dict(zip([o.name for o in s.get_outputs()], outs))
print("forward ms", ms, "outputs", len(d))
print("logits", d["logits"].shape, d["logits"].dtype)
print("hidden_states.0", d["hidden_states.0"].shape, "hidden_states.12", d["hidden_states.12"].shape, d["hidden_states.12"].dtype)
a = d["attentions.3"].astype(np.float32)
print("attentions.3", a.shape, "rows sum to 1:", bool(np.allclose(a.sum(-1), 1, atol=2e-2)), "causal:", bool(np.allclose(np.triu(a[0, 0], 1), 0, atol=1e-6)))
print("ln_f_out", d["ln_f_out"].shape, "argmax last token id", int(d["logits"][0, -1].astype(np.float32).argmax()))
