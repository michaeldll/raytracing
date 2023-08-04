import Criador from "../../renderer";
import Mesh from "../../abstract/Mesh";

export default class Triangle extends Mesh {
    protected positionsBuffer: GPUBuffer;

    constructor(renderer: Criador, shader: string) {
        super(renderer, shader);

        this.initShaderModules(shader)
        this.initAttributeBuffers()
        this.initPipeline()
    }

    protected initShaderModules = (shader: string): void => {
        this.shaderModule = this.renderer.device.createShaderModule({
            label: 'Basic Triangle Shader Module', // Labels are useful for debugging 
            code: shader
        });
    }

    protected initAttributeBuffers(): void {
        // [0]: It's easiest to specify vertex data with TypedArrays, like a Float32Array. You are responsible for making sure the layout of the data matches the layout that you describe in the pipeline 'buffers'.
        const vertexData = new Float32Array([
            // X,Y,Z    R,G,B,A,
            0, 1, 1, 1, 0, 0, 1,
            -1, -1, 1, 0, 1, 0, 1,
            1, -1, 1, 0, 0, 1, 1,
        ]);
        this.positionsBuffer = this.renderer.device.createBuffer({
            // [0]: Buffers are given a size in bytes at creation that can't be changed.
            size: vertexData.byteLength,
            // [0]: Usage defines what this buffer can be used for: VERTEX = Can be passed to setVertexBuffer(); COPY_DST = You can write or copy data into it after creation.
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        });

        // [0]: writeBuffer is the easiest way to TypedArray data into a buffer.
        this.renderer.device.queue.writeBuffer(this.positionsBuffer, 0, vertexData);
    }

    // [1]: A pipeline, or more specifically a “render pipeline”, represents a pair of shaders used in a particular way.
    protected initPipeline(): void {
        // [0]: Pipelines bundle most of the render state (like primitive types, blend modes, etc) and shader entry points into one big object.
        // [1]: Shader linking happens when you call createRenderPipeline, so it is a slow call as your shaders might be adjusted internally depending on the settings. 
        this.pipeline = this.renderer.device.createRenderPipeline({
            label: 'Triangle Render Pipeline',
            // [0]: All pipelines need a layout, but if you don't need to share data between pipelines you can use the 'auto' layout to have it generate one for you!
            layout: 'auto',
            vertex: {
                module: this.shaderModule,
                entryPoint: 'vertexMain',
                // [0]: `buffers` describes the layout of the attributes in the vertex buffers.
                buffers: [{
                    arrayStride: 28, // [0]: Bytes per vertex (3 floats + 4 floats)
                    attributes: [{
                        shaderLocation: 0, // [0]: VertexIn.pos in the shader
                        offset: 0, // [0]: Starts at the beginning of the buffer
                        format: 'float32x3' // [0]: Data is 3 floats
                    }, {
                        shaderLocation: 1, // [0]: VertexIn.color in the shader
                        offset: 12, // [0]: Starts 12 bytes (3 floats) in to the buffer
                        format: 'float32x4' // [0]: Data is 4 floats
                    }]
                }],
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
        });
    }

    public render = (): void => {
        // [0]: Set the pipeline to use when drawing.
        this.renderer.passEncoder.setPipeline(this.pipeline);
        // [0]: Set the vertex buffer to use when drawing. The `0` corresponds to the index of the `buffers` array in the pipeline.
        this.renderer.passEncoder.setVertexBuffer(0, this.positionsBuffer);
        // [0]: Draw 3 vertices using the previously set pipeline and vertex buffer.
        this.renderer.passEncoder.draw(3);

        // [1]: Back in WebGL we needed to call gl.viewport. In WebGPU, the pass encoder defaults to a viewport that matches the size of the attachments so unless we want a viewport that doesn’t match we don’t have to set a viewport separately.

        // We also don’t need to call gl.clearColor or gl.clearDepth. Instead, we specify the clear values when we begin the render pass.

        // [1]: In WebGL we called gl.clear to clear the canvas. Whereas in WebGPU we had previously set that up when creating our render pass descriptor.
    }
}