// Fetch a wgsl shader from the /public folder
export async function fetchShader(path: string) {
    return await fetch(path)
        .then(result => result.text());
}