import { PlayableTraining } from "./training";
import { DataStore, load_file } from "./data_manager";

export interface RenderInfo {
    TrainingName: string;
    SongName: string;
    remaining: number;
    completion: number;
    beat: number;
    displaytext: string;
    displaycountdown: number;
    introcountdown: number;
    currentTempo: number;
    nextTempo: number;
}

export const defaultRenderInfo: RenderInfo = {
    TrainingName: "Kein Training geladen",
    SongName: "Kein Song geladen",
    remaining: 0,
    completion: 0,
    beat: 1,
    displaytext: "",
    displaycountdown: 0,
    introcountdown: 0,
    currentTempo: 0,
    nextTempo: 0,
};

async function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
    const reader = new FileReader();
    return new Promise((resolve, _) => {
        reader.onloadend = () => {
            resolve(reader.result as ArrayBuffer);
        }
        reader.readAsArrayBuffer(file);
    })
}

export class AudioPlayer {
    private _currentAudio: AudioBufferSourceNode | null;
    private _nextAudio: AudioBufferSourceNode | null;
    private _training: PlayableTraining | null;
    private _audioContext: AudioContext;
    private _gainNode: GainNode;
    private _currentSongIndex: number;
    private _isPlaying: boolean;
    private _songOffset: number;
    private _startTime: number;
    private _nextStartTime: number;
    private _nextScheduled: boolean;
    private _isBusy: boolean;
    private _db: DataStore;
    private _showMessage: (body: string, is_err: boolean) => void;

    constructor(showMessage: (body: string, is_err: boolean) => void) {
        this._currentAudio = null;
        this._nextAudio = null;
        this._training = null;
        this._audioContext = new AudioContext();
        this._gainNode = this._audioContext.createGain();
        this._gainNode.connect(this._audioContext.destination);
        this._currentSongIndex = 0;
        this._isPlaying = false;
        this._startTime = 0;
        this._nextStartTime = 0;
        this._songOffset = 0;
        this._nextScheduled = false;
        this._isBusy = true;
        this._db = new DataStore();
        this._showMessage = showMessage;
        this._initializeDb();
    }

    private async _initializeDb() {
        await this._db.Initialize();
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

    async chooseTraining(training: PlayableTraining) {
        if (this._isBusy) return;
        try {
            this._isBusy = true;
            this._training = training;
            this._initialize();
        } catch (err) {
            this._showMessage(`error: ${err}`, true);
        } finally {
            this._isBusy = false;
        }
    }

    private async _loadAudioFile(path: string): Promise<AudioBufferSourceNode> {
        const audio_file = await load_file(path);
        if (!audio_file) throw `Training referenced file '${path}' could not be found`;
        const array_buffer = await readFileAsArrayBuffer(audio_file);
        if (!array_buffer) throw `Could not load '${path} as array buffer`;
        const audio_buffer = await this._audioContext.decodeAudioData(array_buffer);
        const node = new AudioBufferSourceNode(this._audioContext, {
            buffer: audio_buffer,
        });
        node.connect(this._gainNode);
        return node;
    }

    async play() {
        if (this._isPlaying
            || !this._training
            || this._isBusy
            || this._training.Content.length <= this._currentSongIndex) return;

        this._isBusy = true;
        const firstInstance = this._training.Content[this._currentSongIndex];
        const firstName = firstInstance.SongName;
        const first = (await this._db.GetSong(firstName)).Path;
        this._currentAudio = await this._loadAudioFile(first);
        const now = this._audioContext.currentTime;
        this._startTime = now - this._songOffset;
        this._currentAudio.start(now, this._songOffset);
        this._gainNode.gain.setValueAtTime(firstInstance.Volume, now);
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
        const nextVolume = this._training?.Content[this._currentSongIndex + 1].Volume ?? 1;
        this._nextAudio.start(this._nextStartTime);
        this._gainNode.gain.setValueAtTime(nextVolume, this._nextStartTime);
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
                    this._showMessage(`Fehler beim Laden des nächsten Songs: ${reason}`, true);
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
        let nextTempo = 0;
        if (this._currentSongIndex < this._training.Content.length - 1) {
            const nextSongInstance = this._training.Content[this._currentSongIndex + 1];
            const nextSong = await this._db.GetSong(nextSongInstance.SongName);
            nextTempo = nextSong.Tempo;
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
            currentTempo: song.Tempo,
            nextTempo: nextTempo,
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
            const newVolume = this._training?.Content[this._currentSongIndex + 1].Volume ?? 1;
            this._gainNode.gain.setValueAtTime(newVolume, this._audioContext.currentTime);
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
