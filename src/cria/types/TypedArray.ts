// Instead of using this, you can also use ArrayBufferView, which is the base class for all TypedArray classes.
// However, I have had issues using it.
export type TypedArray = Int8Array | Uint8Array | Int16Array | Uint16Array | Int32Array | Uint32Array | Uint8ClampedArray | Float32Array | Float64Array;