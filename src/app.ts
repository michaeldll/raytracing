import Criador from "./cria/renderer";
import shader from "./shaders/raymarching.wgsl"
import FullScreenTriangle from "./cria/examples/meshes/FullScreenPlane";
import "./scss/global.scss";

const canvas = document.querySelector(".webgpu-canvas") as HTMLCanvasElement;
const renderer = new Criador(canvas)

renderer.init().then(() => {
  const triangle = new FullScreenTriangle(renderer, shader)
  renderer.sceneGraph.push(triangle)
  renderer.render()
})

// Enable hot reloading in development
type Window = typeof window & { IS_PRODUCTION: boolean; };
if (!(window as Window).IS_PRODUCTION) {
  new EventSource('/esbuild').addEventListener('change', () => location.reload())
};