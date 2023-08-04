import Criador from "../../renderer";
import Geometry from "../../geometries/plane";
import Mesh from "../../abstract/Mesh";
import createBuffer from "../../utils/createBuffer";

export default class Plane extends Mesh {
    fragmentShaderUniformValues: Float32Array;
    fragmentUniformBuffer: GPUBuffer;
    positionsBuffer: GPUBuffer;
    uvsBuffer: GPUBuffer;
    indicesBuffer: GPUBuffer;
    bindGroup: GPUBindGroup
    tintUniform: Float32Array;

    constructor(renderer: Criador, shader: string) {
        super(renderer, shader);

        this.initShaderModules(shader)
        this.initAttributeBuffers()
        this.initPipeline()
        this.initUniforms()
    }

    protected initShaderModules = (shader: string): void => {
        this.shaderModule = this.renderer.device.createShaderModule({
            label: 'Fullscreen Shader Module',
            code: shader
        });
    }

    protected initAttributeBuffers(): void {
        const { positions, indices, uvs } = Geometry;
        // [0]: It's easiest to specify vertex data with TypedArrays, like a Float32Array. You are responsible for making sure the layout of the data matches the layout that you describe in the pipeline 'buffers'.
        this.positionsBuffer = createBuffer(this.renderer.device, positions, GPUBufferUsage.VERTEX);
        this.uvsBuffer = createBuffer(this.renderer.device, uvs, GPUBufferUsage.VERTEX);
        this.indicesBuffer = createBuffer(this.renderer.device, indices, GPUBufferUsage.INDEX);

        // [0]: writeBuffer is the easiest way to TypedArray data into a buffer.
        this.renderer.device.queue.writeBuffer(this.positionsBuffer, 0, positions);
        this.renderer.device.queue.writeBuffer(this.uvsBuffer, 0, uvs);
        this.renderer.device.queue.writeBuffer(this.indicesBuffer, 0, indices);
    }

    // [1]: A pipeline, or more specifically a “render pipeline”, represents a pair of shaders used in a particular way.
    protected initPipeline(): void {
        // [0]: Pipelines bundle most of the render state (like primitive types, blend
        // [0]: modes, etc) and shader entry points into one big object.
        // [1]: Shader linking happens when you call createRenderPipeline, so it is a slow call as your shaders might be adjusted internally depending on the settings. 
        this.pipeline = this.renderer.device.createRenderPipeline({
            label: 'Triangle Render Pipeline',
            // [0]: All pipelines need a layout, but if you don't need to share data between pipelines you can use the 'auto' layout to have it generate one for you!
            layout: 'auto',
            vertex: {
                module: this.shaderModule,
                entryPoint: 'vertexMain',
                // [0]: `buffers` describes the layout of the attributes in the vertex buffers.
                buffers: [
                    {
                        arrayStride: 3 * 4, // [0]: Bytes per vertex (3 floats)
                        attributes: [{
                            shaderLocation: 0, // [0]: VertexIn.pos in the shader
                            offset: 0, // [0]: Starts at the beginning of the buffer
                            format: 'float32x3' // [0]: Data is 3 floats
                        }]
                    },
                    // texcoords
                    {
                        arrayStride: 2 * 4,
                        attributes: [
                            { shaderLocation: 1, offset: 0, format: 'float32x2', },
                        ],
                    },
                ],
            },
            fragment: {
                module: this.shaderModule,
                entryPoint: 'fragmentMain',
                // [0]: `targets` indicates the format of each render target this pipeline outputs to. It must match the colorAttachments of any renderPass it's used with.
                targets: [{
                    format: navigator.gpu.getPreferredCanvasFormat(),
                }],
            },
            primitive: {
                cullMode: 'back', // [2] Default is 'none'
            },
            ...(this.renderer.settings.sampleCount > 1 && {
                multisample: {
                    count: this.renderer.settings.sampleCount,
                },
            }),
        });
    }

    protected initUniforms(): void {
        // [1]: 1 vec4 * 4 floats per vec4 * 4 bytes per floating point number
        const size = 4 * 4;

        // In WebGPU, we have to create a buffer to store our uniform data
        this.fragmentUniformBuffer = this.renderer.device.createBuffer({
            size,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
        this.fragmentShaderUniformValues = new Float32Array(3);  // 1 vec3
        this.tintUniform = this.fragmentShaderUniformValues.subarray(0, 3);
        this.tintUniform[0] = 1;
        this.tintUniform[1] = 0;
        this.tintUniform[2] = 0;

        // We then create a bind group to bind that buffer to a uniform slot in our shader
        this.bindGroup = this.renderer.device.createBindGroup({
            layout: this.pipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: this.fragmentUniformBuffer } },
            ],
        });

        this.renderer.device.queue.writeBuffer(this.fragmentUniformBuffer, 0, this.fragmentShaderUniformValues);
    }

    public render = (): void => {
        // [0]: Set the pipeline to use when drawing.
        // [1]: which is kind of like the equivalent of gl.useProgram
        this.renderer.passEncoder.setPipeline(this.pipeline);
        // [1]: The bind group supplies samplers, textures, and uniforms buffers
        this.renderer.passEncoder.setBindGroup(0, this.bindGroup);
        // [0]: Set the vertex buffer to use when drawing. The `0` corresponds to the index of the `buffers` array in the pipeline.
        this.renderer.passEncoder.setVertexBuffer(0, this.positionsBuffer);
        this.renderer.passEncoder.setVertexBuffer(1, this.uvsBuffer);
        this.renderer.passEncoder.setIndexBuffer(this.indicesBuffer, 'uint16');
        this.renderer.passEncoder.drawIndexed(Geometry.indices.length);
        // [0]: Draw 3 vertices using the previously set pipeline and vertex buffer.
        this.renderer.passEncoder.draw(3);

        // [1]: Back in WebGL we needed to call gl.viewport. In WebGPU, the pass encoder defaults to a viewport that matches the size of the attachments so unless we want a viewport that doesn’t match we don’t have to set a viewport separately.

        // We also don’t need to call gl.clearColor or gl.clearDepth. Instead, we specify the clear values when we begin the render pass.

        // [1]: In WebGL we called gl.clear to clear the canvas. Whereas in WebGPU we had previously set that up when creating our render pass descriptor.
    }
}