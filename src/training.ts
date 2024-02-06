export interface Display {
    Text: string,
    Time: number,
}

export interface Song {
    Path: string,
    Name: string,
    Tempo: number,
    Intro: number,
    Instructions: Display[],
}

export interface Training {
    Name: string,
    Content: Song[],
}