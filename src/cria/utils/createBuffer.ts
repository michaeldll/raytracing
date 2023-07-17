// From [1]
export default function createBuffer(device: GPUDevice, data: any, usage: GPUBufferUsageFlags): GPUBuffer {
    const buffer = device.createBuffer({
        size: data.byteLength,
        usage: usage | GPUBufferUsage.COPY_DST,
        mappedAtCreation: true,
    });
    const dst = new data.constructor(buffer.getMappedRange());
    dst.set(data);
    buffer.unmap();
    return buffer;
}