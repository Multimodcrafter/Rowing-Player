export async function import_file(input: File) {
    console.log("importing " + input.name);
    const storage = navigator.storage;
    const root = await storage.getDirectory();
    const target = await root.getFileHandle(input.name, {create: true});
    const writableTarget = await target.createWritable();
    await writableTarget.write(input);
    await writableTarget.close();
    console.log(`import of ${input.name} complete`);
}

export async function load_file(path: string): Promise<File> {
    const storage = navigator.storage;
    const root = await storage.getDirectory();
    const target = await root.getFileHandle(path);
    return target.getFile();
}