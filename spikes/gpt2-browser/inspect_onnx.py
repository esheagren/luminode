"""Print inputs/outputs and node-name patterns of an ONNX graph."""
import sys, onnx, collections
m = onnx.load(sys.argv[1], load_external_data=False)
g = m.graph
print("opset", [(o.domain, o.version) for o in m.opset_import], "ir", m.ir_version)
print("inputs:", [(i.name, [d.dim_param or d.dim_value for d in i.type.tensor_type.shape.dim]) for i in g.input][:6], "... total", len(g.input))
print("outputs:", [(o.name, [d.dim_param or d.dim_value for d in o.type.tensor_type.shape.dim]) for o in g.output][:4], "... total", len(g.output))
ops = collections.Counter(n.op_type for n in g.node)
print("node count", len(g.node), "ops", ops.most_common(25))
limit = int(sys.argv[2]) if len(sys.argv) > 2 else 80
for n in g.node[:limit]:
    print(f"{n.op_type:12s} {n.name[:70]:70s} in={[x[:40] for x in n.input][:3]} out={list(n.output)[:2]}")
