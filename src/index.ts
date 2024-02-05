import * as JSZip from "jszip";

require('./mystyles.scss');

interface Display {
    Text: string,
    Time: number,
}

interface Song {
    Path: string,
    Tempo: number,
    Intro: number,
    Instructions: Display[],
}

interface Training {
    Name: string,
    Content: Song[],
}

interface RenderInfo {
    SongName: string,
    remaining: number,
    completion: number,
    beat: number,
    displaytext: string,
    displaycountdown: number,
    introcountdown: number,
}

function isIterable(obj: any): boolean {
    if (obj == null) return false;
    return typeof obj[Symbol.iterator] === "function";
}

function displayIsValid(disp: any): disp is Display {
    if (typeof disp.Text !== "string") return false;
    if (typeof disp.Time !== "number") return false;
    return true;
}

function songIsValid(song: any): song is Song {
    if (typeof song.Path !== "string") return false;
    if (typeof song.Tempo !== "number") return false;
    if (typeof song.Intro !== "number") return false;
    if (!isIterable(song.Instructions)) return false;
    for (const inst of song.Instructions) {
        if(!displayIsValid(inst)) return false;
    }
    return true;
}

function trainingIsValid(obj: any): obj is Training {
    if (typeof obj.Name !== "string") return false;
    if (!isIterable(obj.Content)) return false;
    for (const song of obj.Content) {
        if(!songIsValid(song)) return false;
    }
    return true;
}

const defaultRenderInfo: RenderInfo = {
    SongName: "Kein Song geladen",
    remaining: 0,
    completion: 0,
    beat: 1,
    displaytext: "",
    displaycountdown: 0,
    introcountdown: 0
}

class State {
    private _currentAudio: AudioBufferSourceNode | null;
    private _nextAudio: AudioBufferSourceNode | null;
    private _training: Training | null;
    private _audioContext: AudioContext;
    private _trainingFile: JSZip | null;
    private _currentSongIndex: number;
    private _isPlaying: boolean;
    private _songOffset: number;
    private _startTime: number;
    private _nextStartTime: number;
    private _nextScheduled: boolean;
    private _isBusy: boolean;

    constructor() {
        this._currentAudio = null;
        this._nextAudio = null;
        this._training = null;
        this._audioContext = new AudioContext();
        this._trainingFile = null;
        this._currentSongIndex = 0;
        this._isPlaying = false;
        this._startTime = 0;
        this._nextStartTime = 0;
        this._songOffset = 0;
        this._nextScheduled = false;
        this._isBusy = false;
    }

    private _initialize() {
        this._currentAudio = null;
        this._nextAudio = null;
        this._currentSongIndex = 0;
        this._isPlaying = false;
        this._startTime = 0;
        this._nextStartTime = 0;
        this._songOffset = 0;
        this._nextScheduled = false;
    }

    private async _loadTrainingFromZip(): Promise<Training> {
        const file_name = "training.json";
        const training_file = this._trainingFile?.file(file_name);
        if(!training_file) throw `File '${file_name}' is missing`;
        const training_contents = await training_file.async("text");
        if (!training_contents) throw `File '${file_name}' does not contain valid text`;
        let training;
        try { training = JSON.parse(training_contents); }
        catch { throw `File '${file_name}' did not contain valid JSON`; }
        if (!trainingIsValid(training)) throw `Invalid training object in file '${file_name}'`;
        return training;
    }

    async chooseTraining(evt: Event) {
        const target = evt.target as HTMLInputElement;
        if (!target.files 
            || this._isBusy) return;

        try {
            this._isBusy = true;
            const zip = new JSZip();
            this._trainingFile = await zip.loadAsync(target.files[0]);
            this._training = await this._loadTrainingFromZip();
            this._initialize();
        } catch (err) {
            console.log(`error: ${err}`);
        } finally {
            this._isBusy = false;
        }
    }

    private async _loadAudioFile(path: string): Promise<AudioBufferSourceNode> {
        const audio_file = this._trainingFile?.file(path);
        if(!audio_file) throw `Training referenced file '${path}' could not be found`;
        const array_buffer = await audio_file.async("arraybuffer");
        if(!array_buffer) throw `Could not load '${path} as array buffer`;
        const audio_buffer = await this._audioContext.decodeAudioData(array_buffer);
        const node = new AudioBufferSourceNode(this._audioContext, {
            buffer: audio_buffer,
        });
        node.connect(this._audioContext.destination);
        return node;
    }

    async play() {
        if (this._isPlaying 
            || !this._training 
            || this._isBusy
            || this._training.Content.length <= this._currentSongIndex) return;

        this._isBusy = true;
        const first = this._training.Content[this._currentSongIndex].Path;
        this._currentAudio = await this._loadAudioFile(first);
        const now = this._audioContext.currentTime;
        this._startTime = now - this._songOffset;
        this._currentAudio.start(now, this._songOffset);
        this._isPlaying = true;
        
        if (this._training.Content.length <= this._currentSongIndex + 1) {
            this._isBusy = false;
            return;
        }

        const second = this._training.Content[this._currentSongIndex + 1].Path;
        this._nextAudio = await this._loadAudioFile(second);
        this._isBusy = false;
    }

    pause() {
        if (!this._isPlaying || this._isBusy) return;
        this._isPlaying = false;
        if (this._currentAudio) {
            const now = this._audioContext.currentTime;
            this._songOffset = now - this._startTime;
            this._currentAudio.stop();
        }
        if (this._nextScheduled) this._nextAudio?.stop();
        this._nextScheduled = false;
    }

    reset() {
        if (this._isBusy) return;
        if (this._isPlaying) this.pause();
        this._initialize();
    }

    isPlaying(): boolean {
        return this._isPlaying;
    }

    isBusy(): boolean {
        return this._isBusy;
    }

    private _scheduleNext() {
        if (! this._isPlaying
            || this._nextScheduled
            || !this._currentAudio
            || !this._currentAudio.buffer
            || !this._nextAudio) return;
        
        this._nextStartTime = this._startTime + this._currentAudio.buffer.duration;
        this._nextAudio.start(this._nextStartTime);
        this._nextScheduled = true;
    }

    private async _shiftQueue() {
        if (! this._isPlaying
            || this._isBusy
            || !this._training) return;
        this._isBusy = true;
        this._startTime = this._nextStartTime;
        this._currentAudio = this._nextAudio;
        this._currentSongIndex += 1;
        if (this._training.Content.length > this._currentSongIndex + 1) {
            this._nextAudio = await this._loadAudioFile(this._training.Content[this._currentSongIndex + 1].Path);
        } else {
            this._nextAudio = null;
        }
        this._nextScheduled = false;
        this._isBusy = false;
    }

    private assembleRenderInfo(remaining: number, completion: number): RenderInfo {
        if (!this._training) return defaultRenderInfo;
        const song = this._training.Content[this._currentSongIndex];
        const name = song.Path;
        const totalBeats = this._songOffset * song.Tempo / 60
        const beat = Math.ceil(totalBeats % 4);
        let intro = 0;
        if (song.Intro > 0) {
            const remaining = Math.ceil(song.Intro - totalBeats);
            if (remaining > 0) {
                intro = remaining - 1;
            }
        }
        let disp = "";
        let dispCt = 0;
        for(const d of song.Instructions) {
            if (this._songOffset < d.Time) {
                disp = d.Text;
                dispCt = Math.ceil(d.Time - this._songOffset);
                break;
            }
        }
        return {
            remaining: remaining,
            completion: completion,
            SongName: name,
            beat: beat,
            displaycountdown: dispCt,
            displaytext: disp,
            introcountdown: intro,
        }
    }

    async render(): Promise<RenderInfo> {
        if (!this._currentAudio
            || !this._currentAudio.buffer) return this.assembleRenderInfo(0,0);
        const now = this._audioContext.currentTime;
        if (this._isPlaying) this._songOffset = now - this._startTime;
        const currentRemaining = this._currentAudio.buffer.duration - this._songOffset;
        if (currentRemaining < 1) this._scheduleNext();
        if (currentRemaining < 0.01) await this._shiftQueue();
        const completion = this._songOffset / this._currentAudio.buffer.duration;
        return this.assembleRenderInfo(currentRemaining, completion);
    }

    async playNext() {
        if (!this._isPlaying
            || this._nextScheduled
            || this._isBusy
            || !this._currentAudio) return;
        this._currentAudio.stop();
        this._nextStartTime = this._audioContext.currentTime;
        if (this._nextAudio) {
            this._nextAudio.start();
        } else {
            this._isPlaying = false;
        }
        await this._shiftQueue();
    }

    async playPrevious() {
        if (!this._isPlaying
            || this._isBusy
            || this._currentSongIndex == 0) return;
        this.pause();
        this._currentSongIndex -= 1;
        this._songOffset = 0;
        await this.play();
    }
}



const state = new State();

const file_selector = document.getElementById("file-selector");

const remainingDisplay = document.getElementById("remaining-display");
const introDisplay = document.getElementById("intro-display");
const introTextElement = document.getElementById("intro-text");
const instDisplay = document.getElementById("instruction-display");
const instTextElement = document.getElementById("instruction-text");
const beatDisplay = document.getElementById("beat-display");
const nameDisplay = document.getElementById("name-display");
const remainingIndicator = document.getElementById("remaining-indicator");

const playButton = document.getElementById("play-button");
const resetButton = document.getElementById("reset-button");
const nextButton = document.getElementById("next-button");
const previousButton = document.getElementById("previous-button");

function setControlState() {
    if (state.isBusy() || state.isPlaying()) {
        file_selector?.setAttribute("disabled", "true");
        resetButton?.setAttribute("disabled", "true");
    } else {
        file_selector?.removeAttribute("disabled");
        resetButton?.removeAttribute("disabled");
    }

    if (state.isBusy() || !state.isPlaying()) {
        nextButton?.setAttribute("disabled", "true");
        previousButton?.setAttribute("disabled", "true");
    } else {
        nextButton?.removeAttribute("disabled");
        previousButton?.removeAttribute("disabled");
    }

    if (state.isBusy()) {
        playButton?.setAttribute("disabled", "true");
    } else {
        playButton?.removeAttribute("disabled");
    }
    
    if(!playButton) return;
    let span = playButton.children[0];
    let icon = span.children[0];
    if (state.isPlaying()) {
        icon.classList.remove("fa-play");
        icon.classList.add("fa-pause");
    } else {
        icon.classList.remove("fa-pause");
        icon.classList.add("fa-play");
    }
}

async function render() {
    if (!remainingDisplay
        || !introDisplay
        || !instDisplay
        || !beatDisplay
        || !nameDisplay
        || !remainingIndicator
        || !introTextElement
        || !instTextElement) return;

    const renderInfo = await state.render();
    let minutes = Math.floor(renderInfo.remaining / 60);
    let seconds = Math.ceil(renderInfo.remaining % 60);
    if (seconds == 60) {
        minutes += 1;
        seconds = 0;
    }
    remainingDisplay.innerText = `${minutes}:${seconds.toString().padStart(2,'0')}`;
    beatDisplay.innerText = renderInfo.beat.toString();
    nameDisplay.innerText = renderInfo.SongName;
    remainingIndicator.setAttribute("value", (renderInfo.completion * 100).toString())
    if (renderInfo.introcountdown > 0) {
        introDisplay.classList.remove("is-hidden");
        introTextElement.innerText = `Vorlauf - Start in ${renderInfo.introcountdown}`;
    } else {
        introDisplay.classList.add("is-hidden");
        introTextElement.innerText = "";
    }
    if (renderInfo.displaycountdown > 0 && renderInfo.displaytext != "") {
        instDisplay.classList.remove("is-hidden");
        instTextElement.innerText = `${renderInfo.displaytext} - ${renderInfo.displaycountdown}`;
    } else {
        instDisplay.classList.add("is-hidden");
        instTextElement.innerText = "";
    }
    setControlState();
    window.requestAnimationFrame(render);
}

async function playPause() {
    if (state.isPlaying()) {
        state.pause();
    } else {
        await state.play();
    }
}

function reset() {
    state.reset();
}

async function next() {
    await state.playNext();
}

async function previous() {
    await state.playPrevious();
}

async function chooseTraining(evt: Event) {
    await state.chooseTraining(evt);
}

function initialize() {
    file_selector?.addEventListener("change", chooseTraining);
    playButton?.addEventListener("click", playPause);
    resetButton?.addEventListener("click", reset);
    nextButton?.addEventListener("click", next);
    previousButton?.addEventListener("click", previous);
    window.requestAnimationFrame(render);
}

initialize();
