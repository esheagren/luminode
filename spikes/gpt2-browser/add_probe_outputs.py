"""Graph surgery: expose GPT-2's residual stream and attention probabilities as
extra ONNX outputs, without re-exporting from PyTorch.

The Xenova/gpt2 exports are "merged" graphs: one top-level `If` node whose two
branches (with / without KV cache) share the outer graph's initializers. We add
the same extra outputs to BOTH branches (ONNX requires matching output lists),
then to the `If` node and the outer graph.

New outputs (names follow HF conventions so transformers.js returns them as-is):
  hidden_states.0        = wte + wpe (embedding output)          [batch, seq, 768]
  hidden_states.{i+1}    = output of block i (after its MLP add)  [batch, seq, 768]  i = 0..11
  attentions.{i}         = softmax(QK^T/sqrt(d) + mask) of block i [batch, 12, seq, kv_seq]
  ln_f_out               = final LayerNorm output (input to lm_head) [batch, seq, 768]

Usage: python add_probe_outputs.py <in.onnx> <out.onnx>
"""
import sys
import onnx
from onnx import helper, TensorProto

src, dst = sys.argv[1], sys.argv[2]
m = onnx.load(src, load_external_data=False)
g = m.graph
if_node = next(n for n in g.node if n.op_type == "If")

N_LAYERS = 12
# Residual stream entering block i is the input of block i's first LayerNorm;
# the final residual (hidden_states.12) is the input of ln_f. Attention probs are
# the Softmax node's output. We resolve tensor names by NODE name, which is stable
# across the fp32 / fp16 / quantized exports (tensor names are not).
probes = []  # (output_name, resolver(sg) -> tensor name, dims)
for i in range(N_LAYERS):
    probes.append((f"hidden_states.{i}", (lambda i: lambda nodes: nodes[f"/transformer/h.{i}/ln_1/ReduceMean"].input[0])(i), ["batch_size", "sequence_length", 768]))
probes.append(("hidden_states.12", lambda nodes: nodes["/transformer/ln_f/ReduceMean"].input[0], ["batch_size", "sequence_length", 768]))
for i in range(N_LAYERS):
    probes.append((f"attentions.{i}", (lambda i: lambda nodes: nodes[f"/transformer/h.{i}/attn/Softmax"].output[0])(i), ["batch_size", 12, "sequence_length", "kv_sequence_length"]))
probes.append(("ln_f_out", lambda nodes: nodes["/transformer/ln_f/Add_1"].output[0], ["batch_size", "sequence_length", 768]))

# Determine the element type of the probed tensors (fp32 model -> FLOAT, fp16 model -> FLOAT16).
def tensor_dtype(sg, name):
    for n in sg.node:
        if name in n.output and n.op_type == "Cast":
            return n.attribute[0].i
    # Infer from a nearby Cast or fall back: fp16 exports cast logits to float16 at the end.
    return None

for attr in if_node.attribute:
    sg = attr.g
    by_node = {n.name: n for n in sg.node}
    for out_name, resolve, dims in probes:
        src_name = resolve(by_node)
        # Identity node so the branch output has the public name.
        sg.node.append(helper.make_node("Identity", [src_name], [out_name], name=f"probe/{out_name}"))
        elem = TensorProto.FLOAT16 if "fp16" in src else TensorProto.FLOAT
        sg.output.append(helper.make_tensor_value_info(out_name, elem, dims))

for out_name, _, dims in probes:
    if_node.output.append(out_name)
    elem = TensorProto.FLOAT16 if "fp16" in src else TensorProto.FLOAT
    g.output.append(helper.make_tensor_value_info(out_name, elem, dims))

onnx.save(m, dst)
print("wrote", dst, "outputs", len(g.output))
