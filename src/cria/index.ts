// [0]: Be sure to npm i @webgpu/types and add them to tsconfig.json
// [0]: Example: "typeRoots": [ "./node_modules/@webgpu/types"]

import '../scss/global.scss'
import Mesh from "./abstract/Mesh";
import FullScreenTriangle from "./examples/FullScreenTriangle";
import { fetchShader } from "./utils/fetchShader";

/**
 * This is the main entry point to the WebGPU app.
 */
export default class Criador {
  public canvas: HTMLCanvasElement;
  public canvasSettings = {
    format: undefined,
    depth: false,
    sampleCount: 4,  // can be 1 or 4
  };

  private adapter: GPUAdapter;
  public device: GPUDevice;
  private context: GPUCanvasContext;
  private commandEncoder: GPUCommandEncoder;
  public passEncoder: GPURenderPassEncoder;
  private colorTexture: GPUTexture;
  private colorTextureView: GPUTextureView;
  private renderPassDescriptor: GPURenderPassDescriptor;
  private renderTarget: GPUTexture;
  private renderTargetView: GPUTextureView;
  private depthTexture: GPUTexture;
  private depthTextureView: GPUTextureView;

  private meshes: Array<Mesh> = [];

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.init()
  }

  async init() {
    this.initAPI().then(() => {
      this.initMeshes()
      this.initRenderPassDescriptor()
      this.render()
    })
  }

  /* Initialisation :*/
  // [0]: Adapter, device, context
  async initAPI() {
    // [0]: Check for WebGPU support first by seeing if navigator.gpu exists.
    if (!navigator.gpu) throw new Error("This browser does not support WebGPU.");

    // [0]: WebGPU apps start by getting an Adapter, which represents a physical GPU.
    this.adapter = await navigator.gpu.requestAdapter();

    // [0]: From the adapter, you get a Device, which is the primary WebGPU API on the GPU.
    this.device = await this.adapter.requestDevice();

    // [0]: Devices on their own don't display anything on the page. You need to
    // [0]: configure a canvas context as the output surface.
    this.context = this.canvas.getContext('webgpu');
    this.canvasSettings.format = navigator.gpu.getPreferredCanvasFormat();
    this.context.configure({
      device: this.device,
      // [0]: Mobile and desktop devices have different formats they prefer to output,
      // so usually you'll want to use the "preferred format" for you platform,
      // as queried from navigator.gpu.
      format: this.canvasSettings.format
    });
  }

  // [0]: Buffers, shaders, pipelines
  async initMeshes() {
    const shader = await fetchShader('assets/shaders/exampleUniform.wgsl')
    const triangle = new FullScreenTriangle(this, shader)
    this.meshes.push(triangle)
  }

  initRenderPassDescriptor() {
    let basicColorAttachment: GPURenderPassColorAttachment = {
      view: this.colorTextureView,
      clearValue: { r: 0, g: 0, b: 0, a: 1 },
      loadOp: 'clear',
      storeOp: 'store',
    };

    let renderPassColorAttachment: GPURenderPassColorAttachment = {
      ...basicColorAttachment,
      resolveTarget: undefined, // Assigned Later
    };

    let depthAttachment: GPURenderPassDepthStencilAttachment = {
      view: undefined,
      depthLoadOp: 'clear',
      depthStoreOp: 'store',
      depthClearValue: 1.0,
    }

    const basicRenderPassDescriptor: GPURenderPassDescriptor = {
      label: 'Basic Render Pass',
      colorAttachments: [basicColorAttachment],
    };

    const multisampledRenderPassDescriptor: GPURenderPassDescriptor = {
      label: 'Render Pass',
      colorAttachments: [renderPassColorAttachment],
    };

    const depthMultisampledRenderPassDescriptor: GPURenderPassDescriptor = {
      label: 'Render Pass',
      colorAttachments: [renderPassColorAttachment],
      depthStencilAttachment: depthAttachment,
    };

    if (this.canvasSettings.sampleCount > 1 && !this.canvasSettings.depth) {
      this.renderPassDescriptor = multisampledRenderPassDescriptor
    } else if (this.canvasSettings.sampleCount > 1 && this.canvasSettings.depth) {
      this.renderPassDescriptor = depthMultisampledRenderPassDescriptor
    } else {
      this.renderPassDescriptor = basicRenderPassDescriptor
    }
  }

  /* Events */
  //[1]: resizeToDisplaySize
  resize = () => {
    const { canvas, device, renderTarget, depthTexture } = this;
    const {
      format,
      sampleCount,
      depth
    } = this.canvasSettings;

    // Lookup the size the browser is displaying the canvas in CSS pixels.
    // Unlike WebGL, we also need to clamp the size to the max size the GPU can render (device.limits).
    const width = Math.max(1, Math.min(device.limits.maxTextureDimension2D, canvas.clientWidth));
    const height = Math.max(1, Math.min(device.limits.maxTextureDimension2D, canvas.clientHeight));

    const needResize = sampleCount > 1 && !renderTarget ||
      width !== canvas.width ||
      height !== canvas.height;

    if (!needResize) return;

    // Resizing:
    canvas.width = width;
    canvas.height = height;

    // Rebuild render target
    if (renderTarget) renderTarget.destroy();
    if (sampleCount > 1) {
      const newRenderTarget = device.createTexture({
        size: [canvas.width, canvas.height],
        format,
        sampleCount,
        usage: GPUTextureUsage.RENDER_ATTACHMENT,
      });
      this.renderTarget = newRenderTarget;
      this.renderTargetView = newRenderTarget.createView();
    }

    // Rebuild depth texture
    if (depthTexture) depthTexture.destroy();
    if (depth) {
      const newDepthTexture = device.createTexture({
        size: [canvas.width, canvas.height],
        format: 'depth24plus',
        sampleCount,
        usage: GPUTextureUsage.RENDER_ATTACHMENT,
      });
      this.depthTexture = newDepthTexture;
      this.depthTextureView = newDepthTexture.createView();
    }
  }

  /* Rendering: */
  // [0]: Write and submit commands to queue
  encodeCommands = () => {
    // [0]: Get the current texture from the canvas context and set it as the texture to render to.
    this.colorTexture = this.context.getCurrentTexture();
    this.colorTextureView = this.colorTexture.createView();

    // If we're using multisampling, we need to render to a texture, then resolve it to the canvas.
    if (this.canvasSettings.sampleCount === 1) {
      this.renderPassDescriptor.colorAttachments[0].view = this.colorTexture.createView();
    } else {
      this.renderPassDescriptor.colorAttachments[0].view = this.renderTargetView;
      this.renderPassDescriptor.colorAttachments[0].resolveTarget = this.context.getCurrentTexture().createView();
    }

    // [0]: Command encoders record commands for the GPU to execute.
    this.commandEncoder = this.device.createCommandEncoder({ label: 'Basic Triangle Command Encoder' });

    // Start rendering:
    this.passEncoder = this.commandEncoder.beginRenderPass(this.renderPassDescriptor);

    for (const mesh of this.meshes) {
      mesh.render()
    }

    // Finish rendering.
    this.passEncoder.end();

    // [0]: Finish recording commands, which creates a command buffer.
    return this.commandEncoder.finish();
  }

  render = () => {
    this.resize();

    const commandBuffer = this.encodeCommands()

    // [0]: Command buffers don't execute right away, you have to submit them to the device queue.
    this.device.queue.submit([commandBuffer]);

    requestAnimationFrame(this.render);
  }
}