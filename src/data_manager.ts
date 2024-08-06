import { Song, Training } from "./training";

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
                const songStore = db.createObjectStore("Songs", { keyPath: "Name" });
                songStore.createIndex("Tempo", "Tempo", { unique: false });
                songStore.createIndex("Intro", "Intro", { unique: false });
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
        return new Promise((resolve, reject) => {
            const request = songStore.get(name as IDBValidKey);
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