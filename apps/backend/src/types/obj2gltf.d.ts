declare module 'obj2gltf' {
  type Options = Record<string, unknown>;
  const obj2gltf: (objPath: string, options?: Options) => Promise<Buffer>;
  export default obj2gltf;
}


