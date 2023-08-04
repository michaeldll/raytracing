// [0]: Every vertex attribute input is identified by a @location, which matches up with the shaderLocation specified during pipeline creation.
struct VertexIn {
    @location(0) pos: vec3f,
    @location(1) uv: vec2f,
}
struct VertexOut {
    // [0]: Every vertex shader must output a value with @builtin(position)
    @builtin(position) pos: vec4f,

    @location(1) uv: vec2f,
    // [0]: Other outputs are given a @location so that they can map to the fragment shader inputs.
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

fn calcLookAtMatrix(origin: vec3f, matrixTarget: vec3f, roll: f32) -> mat3x3f {
    var rr: vec3f = vec3f(sin(roll), cos(roll), 0.0);
    var ww: vec3f = normalize(matrixTarget - origin);
    var uu: vec3f = normalize(cross(ww, rr));
    var vv: vec3f = normalize(cross(uu, ww));

    return mat3x3f(uu, vv, ww);
}

fn getRayFromMatrix(camMat: mat3x3f, screenPos: vec2f, lensLength: f32) -> vec3f {
    return normalize(camMat * vec3f(screenPos, lensLength));
}

fn getRay(origin: vec3f, rayTarget: vec3f, screenPos: vec2f, lensLength: f32) -> vec3f {
    var camMat: mat3x3f = calcLookAtMatrix(origin, rayTarget, 0.0);
    return getRayFromMatrix(camMat, screenPos, lensLength);
}

// SDF
fn sdSphere(point: vec3f, radius: f32) -> f32 {
    return length(point) - radius;
}

const steps : i32 = 90;
const maxdist: f32 = 20.0;
const rayMarchPrecision: f32 = 0.001;

//From [4]
fn raymarch(rayOrigin: vec3f, rayDir: vec3f) -> f32 {
    var latest: f32 = rayMarchPrecision * 2.0;
    var dist: f32 = 0.0;
    var res: f32 = -1.0;

    // March along the ray
    for (var i = 0; i < steps; i++) {
        // Break if we're close enough or too far away
        // [3]: All loops in WGSL must terminate.
        if (latest < rayMarchPrecision || dist > maxdist) { break; };
        // Get the SDF distance
        var latest: f32 = sdSphere(rayOrigin + rayDir * dist, 1.0);
        // Increment by the latest SDF distance
        dist += latest;
    }
    // if we're still within bounds,
    // set the result to the distance
    if (dist < maxdist) {
        res = dist;
    }

    return res;
}

struct FragmentOut {
    @location(0) color: vec4f,

    // [0]: Other outputs are given a @location so that they can map to the fragment shader inputs.
}

struct FragmentUniforms {
    tint: vec4f,
};
@group(0) @binding(0) var<uniform> fragmentUniforms: FragmentUniforms;

// [0]: Every fragment shader has to output one vector per pipeline target. The @location corresponds to the target index in the array.
@fragment
fn fragmentMain(in: VertexOut) -> FragmentOut {
    var out: FragmentOut;
    // Uniforms need to be accessed for the bind group to be generated.
    var t: vec4f = vec4f(fragmentUniforms.tint.rgb, fragmentUniforms.tint.a);

    var lensLength: f32 = 1.0;
    var color: vec3f = vec3f(0.0);

    // Bootstrap a raymarching scene
    var rayOrigin: vec3f = vec3f(3.5, 0., 3.5);
    var rayTarget: vec3f = vec3f(0, 0, 0);
    var screenPos: vec2f = in.uv * 2.0 - 1.; // 0 -> 1 to -1 -> 1.
    var rayDirection: vec3f = getRay(rayOrigin, rayTarget, screenPos, lensLength);

    var collision: f32 = raymarch(rayOrigin, rayDirection);

    // If the ray collides, draw the surface
    if (collision > -0.5) {
        color = vec3f(1., 0., 0.);
    }

    out.color = vec4f(color, 1.0);
    //out.color = vec4f(in.uv, 0, 1);

    return out;
}