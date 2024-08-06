import * as JSZip from "jszip";
import { VERSION } from "./sw";
import { Song, Training, Display, SongInstance, trainingIsValid, PlayableTraining } from "./training";
import { DataStore } from "./data_manager";

require('./mystyles.scss');

interface RenderInfo {
    TrainingName: string,
    SongName: string,
    remaining: number,
    completion: number,
    beat: number,
    displaytext: string,
    displaycountdown: number,
    introcountdown: number,
}

const defaultRenderInfo: RenderInfo = {
    TrainingName: "Kein Training geladen",
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
    private _training: PlayableTraining | null;
    private _audioContext: AudioContext;
    private _trainingFile: JSZip | null;
    private _currentSongIndex: number;
    private _isPlaying: boolean;
    private _songOffset: number;
    private _startTime: number;
    private _nextStartTime: number;
    private _nextScheduled: boolean;
    private _isBusy: boolean;
    private _db: DataStore;

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
        this._db = new DataStore();
    }

    public async initialize() {
        await this._db.Initialize();
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
        if (!training_file) throw `File '${file_name}' is missing`;
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
            //TODO: load training from db
            this._initialize();
        } catch (err) {
            showMessage(`error: ${err}`, true);
        } finally {
            this._isBusy = false;
        }
    }

    private async _loadAudioFile(path: string): Promise<AudioBufferSourceNode> {
        const audio_file = this._trainingFile?.file(path);
        if (!audio_file) throw `Training referenced file '${path}' could not be found`;
        const array_buffer = await audio_file.async("arraybuffer");
        if (!array_buffer) throw `Could not load '${path} as array buffer`;
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
        const firstName = this._training.Content[this._currentSongIndex].SongName;
        const first = (await this._db.GetSong(firstName)).Path;
        this._currentAudio = await this._loadAudioFile(first);
        const now = this._audioContext.currentTime;
        this._startTime = now - this._songOffset;
        this._currentAudio.start(now, this._songOffset);
        this._isPlaying = true;

        if (this._training.Content.length <= this._currentSongIndex + 1) {
            this._isBusy = false;
            return;
        }

        const secondName = this._training.Content[this._currentSongIndex + 1].SongName;
        const second = (await this._db.GetSong(secondName)).Path;
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
        if (!this._isPlaying
            || this._nextScheduled
            || !this._currentAudio
            || !this._currentAudio.buffer
            || !this._nextAudio) return;

        this._nextStartTime = this._startTime + this._currentAudio.buffer.duration;
        this._nextAudio.start(this._nextStartTime);
        this._nextScheduled = true;
    }

    private _shiftQueue() {
        if (!this._isPlaying
            || this._isBusy
            || !this._training) return;
        this._isBusy = true;
        this._startTime = this._nextStartTime;
        this._currentAudio = this._nextAudio;
        this._currentSongIndex += 1;
        if (this._training.Content.length > this._currentSongIndex + 1) {
            const nextName = this._training.Content[this._currentSongIndex + 1].SongName;
            this._db.GetSong(nextName)
                .then((nextSong) => this._loadAudioFile(nextSong.Path))
                .then((audioFile) => {
                    this._nextAudio = audioFile;
                    this._nextScheduled = false;
                    this._isBusy = false;
                })
                .catch((reason) => {
                    showMessage(`Fehler beim Laden des nächsten Songs: ${reason}`, true);
                    this._nextAudio = null;
                    this._nextScheduled = false;
                    this._isBusy = false;
                });
            return;
        } else if (this._training.Content.length == this._currentSongIndex) {
            this._initialize();
        } else {
            this._nextAudio = null;
        }
        this._nextScheduled = false;
        this._isBusy = false;
    }

    private async assembleRenderInfo(remaining: number, completion: number): Promise<RenderInfo> {
        if (!this._training || !this._training.Content[this._currentSongIndex]) return defaultRenderInfo;
        const songInstance = this._training.Content[this._currentSongIndex];
        const songName = songInstance.SongName;
        const song = await this._db.GetSong(songName);
        const trainingName = this._training.Name;
        const totalBeats = this._songOffset * song.Tempo / 15
        let beat = Math.ceil(totalBeats % 4);
        if (beat == 0) beat = 1; //only happens in very rare cases where totalBeats is an exact multiple of 4
        let intro = 0;
        if (song.Intro > 0) {
            const remaining = Math.ceil(song.Intro - totalBeats);
            if (remaining > 0) {
                intro = remaining - 1;
            }
        }
        let disp = "";
        let dispCt = 0;
        for (const d of songInstance.Instructions) {
            if (this._songOffset < d.Time) {
                disp = d.Text;
                dispCt = Math.ceil(d.Time - this._songOffset);
                break;
            }
        }
        return {
            TrainingName: trainingName,
            remaining: remaining,
            completion: completion,
            SongName: songName,
            beat: beat,
            displaycountdown: dispCt,
            displaytext: disp,
            introcountdown: intro,
        }
    }

    async render(): Promise<RenderInfo> {
        if (!this._currentAudio
            || !this._currentAudio.buffer) return this.assembleRenderInfo(0, 0);
        const now = this._audioContext.currentTime;
        if (this._isPlaying) this._songOffset = now - this._startTime;
        const currentRemaining = this._currentAudio.buffer.duration - this._songOffset;
        const completion = this._songOffset / this._currentAudio.buffer.duration;
        if (currentRemaining < 1) this._scheduleNext();
        if (currentRemaining < 0.01) await this._shiftQueue();
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
const file_selectorButton = document.getElementById("file-selector-button");

const remainingDisplay = document.getElementById("remaining-display");
const introDisplay = document.getElementById("intro-display");
const introTextElement = document.getElementById("intro-text");
const instDisplay = document.getElementById("instruction-display");
const instTextElement = document.getElementById("instruction-text");
const beatDisplay = document.getElementById("beat-display");
const nameDisplay = document.getElementById("name-display");
const remainingIndicator = document.getElementById("remaining-indicator");
const trainingNameDisplay = document.getElementById("training-name-display");
const headingBox = document.getElementById("heading-box");

const messageBox = document.getElementById("message-box");
const messageTitle = document.getElementById("message-title");
const messageDismiss = document.getElementById("message-dismiss");
const messageBody = document.getElementById("message-body");

const playButton = document.getElementById("play-button");
const resetButton = document.getElementById("reset-button");
const nextButton = document.getElementById("next-button");
const previousButton = document.getElementById("previous-button");

let wakeLock: WakeLockSentinel | null = null;
let wakeLockSupported = true;

function showMessage(body: string, isError: boolean) {
    if (!messageBody || !messageTitle || !messageBox) return;
    messageBody.innerText = body;
    messageTitle.innerText = isError ? "Fehler" : "Warnung";
    messageBox.classList.remove("is-hidden");
}

function dismissMessage() {
    if (!messageBox) return;
    messageBox.classList.add("is-hidden");
}

async function requestWakeLock() {
    if (!wakeLockSupported || (wakeLock !== null && !wakeLock.released)) return;
    if (!('wakeLock' in navigator)) {
        showMessage("Dein Browser hat keine Wakelock-Unterstützung. Das bedeutet, dass ich nicht verhindern kann, dass sich der Bildschirm deines Geräts nach einer gewissen Zeit ausschaltet. Denke daran immer mal wieder den Bildschirm zu berühren (sofern du ein Gerät mit Touchscreen hast).", false);
        wakeLockSupported = false;
        return;
    }
    try {
        wakeLock = await navigator.wakeLock.request('screen');
    } catch (err) {
        showMessage(`${err}`, true);
    }
}

async function releaseWakeLock() {
    if (!wakeLockSupported || !wakeLock || wakeLock.released) return;
    await wakeLock.release();
    wakeLock = null;
}

function setControlState() {
    if (state.isBusy() || state.isPlaying()) {
        file_selectorButton?.setAttribute("disabled", "true");
        resetButton?.setAttribute("disabled", "true");
    } else {
        file_selectorButton?.removeAttribute("disabled");
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
        playButton?.classList.add("is-loading");
        file_selectorButton?.classList.add("is-loading");
    } else {
        playButton?.removeAttribute("disabled");
        playButton?.classList.remove("is-loading");
        file_selectorButton?.classList.remove("is-loading");
    }

    if (state.isPlaying()) {
        requestWakeLock();
        headingBox?.classList.add("is-hidden");
        document.documentElement.classList.add("prevent-overscroll");
    } else {
        releaseWakeLock();
        headingBox?.classList.remove("is-hidden");
        document.documentElement.classList.remove("prevent-overscroll");
    }

    if (!playButton) {
        showMessage("Die Applikation hat einen Defekt. Lade sie bitte neu. Wenn das Problem bestehen bleibt kontaktiere bitte den Entwickler", true);
        console.error("Play button not found");
        return;
    }
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
        || !instTextElement
        || !trainingNameDisplay) {
        showMessage("Die Applikation hat einen Defekt. Lade sie bitte neu. Wenn das Problem bestehen bleibt kontaktiere bitte den Entwickler", true);
        console.error("some elements not found");
        return;
    }

    const renderInfo = await state.render();
    let minutes = Math.floor(renderInfo.remaining / 60);
    let seconds = Math.ceil(renderInfo.remaining % 60);
    if (seconds == 60) {
        minutes += 1;
        seconds = 0;
    }
    remainingDisplay.innerText = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    beatDisplay.innerText = renderInfo.beat.toString();
    nameDisplay.innerText = renderInfo.SongName;
    trainingNameDisplay.innerText = renderInfo.TrainingName;
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
    console.log("Selected training file changed. Initiating load...");
    await state.chooseTraining(evt);
    console.log("File change handler complete");
}

function selectFile() {
    file_selector?.click();
}

function preventAccidentalNavigation(event: Event) {
    if (state.isPlaying()) {
        event.preventDefault();
        event.returnValue = true;
    }
}

function initialize() {
    console.log("Hello from rowing player");
    const versionDisplay = document.getElementById("version-display")
    if (versionDisplay) versionDisplay.innerText = `v${VERSION}`;
    file_selector?.addEventListener("change", chooseTraining);
    playButton?.addEventListener("click", playPause);
    resetButton?.addEventListener("click", reset);
    nextButton?.addEventListener("click", next);
    previousButton?.addEventListener("click", previous);
    file_selectorButton?.addEventListener("click", selectFile);
    messageDismiss?.addEventListener("click", dismissMessage);
    window.requestAnimationFrame(render);
    addEventListener("beforeunload", preventAccidentalNavigation);
}

initialize();
