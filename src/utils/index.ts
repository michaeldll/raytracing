export function callWhenReady(callback: Function) {
  if (document.readyState != 'loading') {
    callback();
  } else {
    document.addEventListener('DOMContentLoaded', (e) => callback());
  }
}