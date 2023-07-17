// [0]: Every vertex attribute input is identified by a @location, which matches up with the shaderLocation specified during pipeline creation.
struct VertexIn {
    @location(0) pos: vec3f,
    @location(1) uv: vec2f,
}
struct VertexOut {
    // [0]: Every vertex shader must output a value with @builtin(position)
    @builtin(position) pos: vec4f,

    // [0]: Other outputs are given a @location so that they can map to the fragment shader inputs.
    @location(1) uv: vec2f,
}
// [0]: Shader entry points can be named whatever you want, and you can have as many as you want in a single shader module.
@vertex
fn vertexMain(in: VertexIn) -> VertexOut {
    var out: VertexOut;
    out.pos = vec4f(in.pos, 1);
    out.uv = in.uv;
    return out;
}

// -----------------------------------------------------------------------

struct FragmentOut {
    @location(0) color: vec4f,
}

// [0]: Every fragment shader has to output one vector per pipeline target. The @location corresponds to the target index in the array.
@fragment
fn fragmentMain(in: VertexOut) -> FragmentOut {
    var out: FragmentOut;
    out.color = vec4f(in.uv, 0, 1);
    return out;
}