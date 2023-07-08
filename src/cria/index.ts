// Be sure to npm i and configure @types/webgpu

import Mesh from "./abstract/Mesh";
import Triangle from "./examples/Triangle";

/**
 * This is the main entry point to the WebGPU app.
 */
export default class Criador {
    canvas: HTMLCanvasElement;
    adapter: GPUAdapter;
    device: GPUDevice;
    context: GPUCanvasContext;
    commandEncoder: GPUCommandEncoder;
    passEncoder: GPURenderPassEncoder;
    colorTexture: GPUTexture;
    colorTextureView: GPUTextureView;

    meshes: Array<Mesh> = [];

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.init()
    }

    async init() {
        this.initAPI().then(() => {
            this.initResources()
            this.render()
        })
    }

    // Adapter, device, context
    async initAPI() {
        // Check for WebGPU support first by seeing if navigator.gpu exists.
        if (!navigator.gpu) throw new Error("This browser does not support WebGPU.");

        // WebGPU apps start by getting an Adapter, which represents a physical GPU.
        this.adapter = await navigator.gpu.requestAdapter();

        // From the adapter, you get a Device, which is the primary WebGPU interface.
        this.device = await this.adapter.requestDevice();

        // Devices on their own don't display anything on the page. You need to
        // configure a canvas context as the output surface.
        this.context = this.canvas.getContext('webgpu');
        this.context.configure({
            device: this.device,
            // Mobile and desktop devices have different formats they prefer to output,
            // so usually you'll want to use the "preferred format" for you platform,
            // as queried from navigator.gpu.
            format: navigator.gpu.getPreferredCanvasFormat()
        });
    }

    // Buffers, shaders, pipeline
    async initResources() {
        const triangle = new Triangle(this)
        this.meshes.push(triangle)
    }
    
    // Write and submit commands to queue
    encodeCommands() {
        // Command encoders record commands for the GPU to execute.
        this.commandEncoder = this.device.createCommandEncoder({label: 'Basic Triangle Command Encoder'});

        let basicColorAttachment: GPURenderPassColorAttachment = {
            view: this.colorTextureView,
            clearValue: { r: 0, g: 0, b: 0, a: 1 },
            loadOp: 'clear',
            storeOp: 'store'
        };

        const basicDescription: GPURenderPassDescriptor = {
            label: 'Basic Render Pass',
            colorAttachments: [basicColorAttachment],
        };

        // All rendering commands happen in a render pass.
        this.passEncoder = this.commandEncoder.beginRenderPass(basicDescription);

        const triangle = this.meshes[0]
        // Set the pipeline to use when drawing.
        this.passEncoder.setPipeline(triangle.pipeline);
        // Set the vertex buffer to use when drawing.
        // The `0` corresponds to the index of the `buffers` array in the pipeline.
        this.passEncoder.setVertexBuffer(0, triangle.vertexBuffer);
        // Draw 3 vertices using the previously set pipeline and vertex buffer.
        this.passEncoder.draw(3);

        // End the render pass.
        this.passEncoder.end();

        // Finish recording commands, which creates a command buffer.
        const commandBuffer = this.commandEncoder.finish();

        return commandBuffer
    }


    render = () => {
        // Get the current texture from the canvas context and
        // set it as the texture to render to.
        this.colorTexture = this.context.getCurrentTexture();
        this.colorTextureView = this.colorTexture.createView();

        const commandBuffer = this.encodeCommands()

        // Command buffers don't execute right away, you have to submit them to the
        // device queue.
        this.device.queue.submit([commandBuffer]);

        requestAnimationFrame(this.render);
    }
}