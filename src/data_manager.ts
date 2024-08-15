import * as JSZip from "jszip";
import { isSongInstance, isTrainingInstance, Song, Training } from "./training";

export class DataStore {
    private db: IDBDatabase | null;
    private dbPromise: Promise<IDBDatabase>;

    constructor() {
        this.db = null;
        this.dbPromise = new Promise((resolve, reject) => {
            const request = indexedDB.open("RowingPlayerDB", 1);
            request.onsuccess = (_) => {
                resolve(request.result);
            }
            request.onerror = reject;
            request.onupgradeneeded = (_) => {
                const db = request.result;
                const songStore = db.createObjectStore("Songs", { keyPath: "Path" });
                songStore.createIndex("Tempo", "Tempo", { unique: false });
                songStore.createIndex("Intro", "Intro", { unique: false });
                songStore.createIndex("Name", "Name", { unique: true });
                db.createObjectStore("Trainings", { keyPath: "Name" });
            }
        })
    }

    public async Initialize() {
        this.db = await this.dbPromise;
    }

    public async GetSong(name: String): Promise<Song> {
        if (this.db == null) {
            throw "DataStore not initialized";
        }
        const transaction = this.db.transaction("Songs");
        const songStore = transaction.objectStore("Songs");
        const nameIndex = songStore.index("Name");
        return new Promise((resolve, reject) => {
            const request = nameIndex.get(name as IDBValidKey);
            request.onsuccess = (_) => {
                resolve(request.result);
            };
            request.onerror = reject;
        });
    }

    public async StoreSong(song: Song): Promise<Event> {
        if (this.db == null) {
            throw "DataStore not initialized";
        }
        const transaction = this.db.transaction("Songs", "readwrite");
        const songStore = transaction.objectStore("Songs");
        return new Promise((resolve, reject) => {
            const request = songStore.put(song);
            request.onsuccess = resolve;
            request.onerror = reject;
        });
    }

    public async GetSongs(tempo: number): Promise<Song[]> {
        if (this.db == null) {
            throw "DataStore not initialized";
        }
        const transaction = this.db.transaction("Songs");
        const songStore = transaction.objectStore("Songs");
        const tempoIndex = songStore.index("Tempo");
        const range = IDBKeyRange.only(tempo);
        return new Promise((resolve, reject) => {
            let songList: Song[] = [];
            const cursor = tempoIndex.openCursor(range);
            cursor.onerror = reject;
            cursor.onsuccess = (evt) => {
                const cursor = (evt.target as IDBRequest<IDBCursorWithValue | null>)?.result;
                if (cursor) {
                    songList.push(cursor.value);
                } else {
                    resolve(songList);
                }
            }
        });
    }

    public async GetIntroSongs(tempo: number): Promise<Song[]> {
        if (this.db == null) {
            throw "DataStore not initialized";
        }
        const transaction = this.db.transaction("Songs");
        const songStore = transaction.objectStore("Songs");
        const tempoIndex = songStore.index("Intro");
        return new Promise((resolve, reject) => {
            const range = IDBKeyRange.lowerBound(0, true);
            const cursor = tempoIndex.getAll(range);
            cursor.onerror = reject;
            cursor.onsuccess = (evt) => {
                const cursor = (evt.target as IDBRequest<IDBCursorWithValue | null>)?.result;
                const songlist = cursor?.value ?? [];
                const result = songlist.filter((song: Song) => song.Tempo == tempo);
                resolve(result);
            }
        });
    }

    public async GetAllSongs(): Promise<Song[]> {
        if (this.db == null) {
            throw "DataStore not initialized";
        }
        const transaction = this.db.transaction("Songs");
        const songStore = transaction.objectStore("Songs");
        return new Promise((resolve, reject) => {
            const request = songStore.getAll();
            request.onsuccess = (_) => {
                resolve(request.result);
            };
            request.onerror = reject;
        });
    }

    public async GetTraining(name: String): Promise<Training> {
        if (this.db == null) {
            throw "DataStore not initialized";
        }
        const transaction = this.db.transaction("Trainings");
        const trainingStore = transaction.objectStore("Trainings");
        return new Promise((resolve, reject) => {
            const request = trainingStore.get(name as IDBValidKey);
            request.onsuccess = (_) => {
                resolve(request.result);
            };
            request.onerror = reject;
        });
    }

    public async GetAllTrainings(): Promise<Training[]> {
        if (this.db == null) {
            throw "DataStore not initialized";
        }
        const transaction = this.db.transaction("Trainings");
        const trainingStore = transaction.objectStore("Trainings");
        return new Promise((resolve, reject) => {
            const request = trainingStore.getAll();
            request.onsuccess = (_) => {
                resolve(request.result);
            };
            request.onerror = reject;
        });
    }

    public async StoreTraining(training: Training): Promise<Event> {
        if (this.db == null) {
            throw "DataStore not initialized";
        }
        const transaction = this.db.transaction("Trainings", "readwrite");
        const trainingStore = transaction.objectStore("Trainings");
        return new Promise((resolve, reject) => {
            const request = trainingStore.put(training);
            request.onsuccess = resolve;
            request.onerror = reject;
        });
    }

    public async StoreTrainings(trainings: Training[]) {
        for (let t in trainings) {
            const training = trainings[t];
            await this.StoreTraining(training);
        }
    }

    public async StoreSongs(songs: Song[]) {
        for (let s in songs) {
            const song = songs[s];
            await this.StoreSong(song);
        }
    }

    public async DeleteSong(path: string): Promise<[void, unknown]> {
        if (this.db == null) {
            throw "DataStore not initialized";
        }
        const transaction = this.db.transaction("Songs", "readwrite");
        const songStore = transaction.objectStore("Songs");
        const delete_file_promise = delete_file(path);
        const delete_row_promise = new Promise((resolve, reject) => {
            const request = songStore.delete(path);
            request.onerror = reject;
            request.onsuccess = resolve;
        });
        return Promise.all([delete_file_promise, delete_row_promise]);
    }

    public async DeleteTraining(name: string): Promise<Event> {
        if (this.db == null) {
            throw "DataStore not initialized";
        }
        const transaction = this.db.transaction("Trainings", "readwrite");
        const trainingStore = transaction.objectStore("Trainings");
        return new Promise((resolve, reject) => {
            const request = trainingStore.delete(name);
            request.onerror = reject;
            request.onsuccess = resolve;
        });
    }

    private async collect_subtrainings(name: string): Promise<Training[]> {
        let result: Training[] = [];
        const initial = await this.GetTraining(name);
        result.push(initial);
        for (const entry of initial.Content) {
            if (!isTrainingInstance(entry)) continue;
            const subtrainings = await this.collect_subtrainings(entry.TrainingName);
            for (const subt of subtrainings) {
                if (result.find((t) => t.Name == subt.Name) !== undefined) continue;
                result.push(subt);
            }
        }
        return result;
    }

    private async collect_training_songs(trainings: Training[]): Promise<Song[]> {
        let result: Song[] = [];
        for (const training of trainings) {
            if (result.find((s) => s.Name == training.PauseSong) === undefined) {
                const song = await this.GetSong(training.PauseSong);
                result.push(song);
            }
            for (const entry of training.Content) {
                if (!isSongInstance(entry) || entry.IsPause) continue;
                if (result.find((s) => s.Name == entry.SongName) !== undefined) continue;
                const song = await this.GetSong(entry.SongName);
                result.push(song);
            }
        }
        return result;
    }

    public async ExportTraining(name: string) {
        const trainings = await this.collect_subtrainings(name);
        const songs = await this.collect_training_songs(trainings);
        const meta = { trainings: trainings, songs: songs };

        const zip = new JSZip();
        zip.file("meta.json", JSON.stringify(meta));

        for (const song of songs) {
            const song_file = await load_file(song.Path);
            zip.file(song.Path, song_file);
        }

        const outfile = await zip.generateAsync({ type: "blob" });
        download(outfile, name + ".zip");
    }
}

export async function import_file(input: File) {
    console.log("importing " + input.name);
    const storage = navigator.storage;
    const root = await storage.getDirectory();
    const target = await root.getFileHandle(input.name, { create: true });
    const writableTarget = await target.createWritable();
    await writableTarget.write(input);
    await writableTarget.close();
    console.log(`import of ${input.name} complete`);
}

export async function load_file(file_name: string): Promise<File> {
    const storage = navigator.storage;
    const root = await storage.getDirectory();
    const target = await root.getFileHandle(file_name);
    return target.getFile();
}

export async function list_files(): Promise<AsyncIterableIterator<string>> {
    const storage = navigator.storage;
    const root = await storage.getDirectory();
    return root.keys();
}

async function delete_file(file_name: string) {
    const storage = navigator.storage;
    const root = await storage.getDirectory();
    await root.removeEntry(file_name);
}

function download(blob: Blob, filename: string) {
    const a = document.createElement("a");
    const url = URL.createObjectURL(blob);
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }, 0);
}