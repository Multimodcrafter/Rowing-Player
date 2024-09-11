export interface Display {
    Text: string,
    Time: number,
}

export interface Song {
    Path: string,
    Name: string,
    Tempo: number,
    Intro: number,
    Length: number,
}

export interface SongInstance {
    SongName: string,
    Instructions: Display[],
    IsPause: boolean,
    Volume: number,
}

export interface TrainingInstance {
    TrainingName: string,
}

export interface Training {
    Name: string,
    IsTemplate: boolean,
    Content: (SongInstance | TrainingInstance)[],
    PauseSong: string,
    PauseVolume: number,
}

export interface PlayableTraining {
    Name: string,
    Content: SongInstance[],
}

function isIterable(obj: any): boolean {
    if (obj == null) return false;
    return typeof obj[Symbol.iterator] === "function";
}

function displayIsValid(disp: any): disp is Display {
    if (typeof disp.Text !== "string") {
        console.log(disp.Text + " is not string");
        return false;
    }
    if (typeof disp.Time !== "number" && typeof disp.Time !== null) {
        console.log(disp.Time + " is not number");
        return false;
    }
    return true;
}

export function songIsValid(song: any): song is Song {
    if (typeof song.Path !== "string") {
        console.log(song.Path + " is not string");
        return false;
    }
    if (typeof song.Name !== "string") {
        console.log(song.Name + " is not string");
        return false;
    }
    if (typeof song.Tempo !== "number") {
        console.log(song.Tempo + " is not number");
        return false;
    }
    if (typeof song.Intro !== "number") {
        console.log(song.Intro + " is not number");
        return false;
    }
    if (typeof song.Length !== "number") {
        console.log(song.Length + " is not number");
        return false;
    }
    return true;
}

export function isSongInstance(songInstance: any): songInstance is SongInstance {
    if (typeof songInstance.SongName !== "string") {
        console.log(songInstance.SongName + " is not string");
        return false;
    }
    if (typeof songInstance.IsPause !== "boolean") {
        console.log(songInstance.IsPause + " is not boolean");
        return false;
    }
    if (!isIterable(songInstance.Instructions)) {
        console.log("instructions not iterable");
        return false;
    }
    for (const inst of songInstance.Instructions) {
        if (!displayIsValid(inst)) return false;
    }
    return true;
}

export function isTrainingInstance(obj: any): obj is TrainingInstance {
    if (typeof obj.TrainingName !== "string") {
        console.log(obj.TrainingName + " is not string");
        return false;
    }
    return true;
}

export function trainingIsValid(obj: any): obj is Training {
    console.log("Validating the following training object:");
    console.log(obj);
    if (typeof obj.Name !== "string") {
        console.log("Training name not string");
        return false;
    }
    if (typeof obj.IsTemplate !== "boolean") {
        console.log(obj.IsTemplate + " is not boolean");
        return false;
    }
    if (typeof obj.PauseSong !== "string") {
        console.log("Training pause song not string");
        return false;
    }
    if (!isIterable(obj.Content)) {
        console.log("Training content not iterable");
        return false;
    }
    for (const song of obj.Content) {
        if (!isSongInstance(song) && !isTrainingInstance(song)) return false;
    }
    return true;
}