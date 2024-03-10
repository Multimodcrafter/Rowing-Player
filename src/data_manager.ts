export async function import_file(input: File): Promise<boolean> {
    console.log("importing " + input.name);
    const storage = navigator.storage;
    const root = await storage.getDirectory();
    const target = await root.getFileHandle(input.name, {create: true});
    const writableTarget = await target.createWritable();
    await writableTarget.write(input);
    await writableTarget.close();
    return true;   
}