<script lang="ts">
    import { DataStore, import_file, list_files } from "./data_manager";
    import { Song } from "./training";

    export let show: boolean = false;
    let files: string[] = [];
    export let db: DataStore;
    export let songs: Song[] = [];
    let editedSong: Song = {
        Name: "",
        Intro: 0,
        Tempo: 0,
        Length: 0,
        Path: "",
    };
    list_files()
        .then(async (values) => {
            for await (const name of values) {
                files.push(name);
            }
        })
        .then(() => console.log("root OPFS:" + files));

    async function SaveSong(idx: number) {
        await db.StoreSong(editedSong);
        songs[idx] = editedSong;
        editedSong = { Name: "", Intro: 0, Tempo: 0, Length: 0, Path: "" };
        songs = songs;
    }

    async function DeleteSong(path: string, idx: number) {
        await db.DeleteSong(path);
        songs.splice(idx, 1);
        songs = songs;
    }

    let chosenFiles: FileList;
    let fileChooser: HTMLElement;
    const audioContext = new AudioContext();
    let importedSong: Song = {
        Path: "",
        Name: "",
        Intro: 0,
        Length: 0,
        Tempo: 0,
    };
    let songFile: File = new File([], "");
    let songLength: number = 0;
    let songLengthWarning: boolean = false;

    async function checkFile() {
        const array_buffer = await songFile.arrayBuffer();
        if (!array_buffer)
            throw `Could not load '${importedSong.Path} as array buffer`;
        const audio_buffer = await audioContext.decodeAudioData(array_buffer);
        if (!audio_buffer)
            throw `Could not load '${importedSong.Path}' as audio file`;
        let roundedDuration = Math.round(audio_buffer.duration / 10) * 10;
        songLength = audio_buffer.duration;
        if (Math.abs(roundedDuration - audio_buffer.duration) != 0) {
            console.warn(
                `${importedSong.Path} is ${audio_buffer.duration} seconds long`,
            );
            songLengthWarning = true;
        } else {
            console.log(
                `${importedSong.Path} is ok (${audio_buffer.duration} seconds long)`,
            );
            songLengthWarning = false;
        }
    }

    async function songChosen() {
        const nameRe = /^(\d\d)_(\d+)_([^\._]*)(.*)(Vorlauf)?(.*)/;
        if (!chosenFiles) return;
        importedSong.Path = chosenFiles[0].name;
        const nameGroups = importedSong.Path.match(nameRe);
        if (nameGroups) {
            importedSong.Name = nameGroups[3];
            importedSong.Tempo = Number.parseInt(nameGroups[1]);
            importedSong.Length = Number.parseInt(nameGroups[2]);
            importedSong.Intro = nameGroups[5] == undefined ? 0 : 32;
        } else {
            importedSong.Name = importedSong.Path;
        }
        songFile = chosenFiles[0];
        await checkFile();
    }

    async function ImportSong() {
        await import_file(songFile);
        await db.StoreSong(importedSong);
        songs.push(importedSong);
        importedSong = { Name: "", Path: "", Intro: 0, Tempo: 0, Length: 0 };
        songs = songs;
    }
</script>

<div class="modal {show ? 'is-active' : ''}">
    <div class="modal-background"></div>
    <div class="modal-card">
        <header class="modal-card-head">
            <p class="modal-card-title">Songs</p>
            <button
                class="delete"
                aria-label="close"
                on:click={() => (show = false)}
            ></button>
        </header>
        <section class="modal-card-body">
            {#if importedSong.Path != ""}
                <p>
                    <span
                        class="icon-text {songLengthWarning
                            ? 'has-text-warning'
                            : 'has-text-info'}"
                    >
                        <span class="icon">
                            <i
                                class="fas {songLengthWarning
                                    ? 'fa-exclamation-triangle'
                                    : 'fa-info-circle'}"
                            ></i>
                        </span>
                        <span>Audiolänge: {songLength} Sekunden</span>
                    </span>
                </p>
            {/if}
            <table class="table">
                <thead>
                    <th>Song</th>
                    <th>Tempo</th>
                    <th>Länge</th>
                    <th>Vorlauf</th>
                    <th style="width: 90px;"></th>
                </thead>
                <tbody>
                    {#if importedSong.Path != ""}
                        <tr>
                            <td
                                ><input
                                    class="input"
                                    type="text"
                                    bind:value={importedSong.Name}
                                />
                            </td>
                            <td
                                ><input
                                    class="input"
                                    type="number"
                                    bind:value={importedSong.Tempo}
                                /></td
                            >
                            <td
                                ><input
                                    class="input"
                                    type="number"
                                    bind:value={importedSong.Length}
                                /></td
                            >
                            <td
                                ><input
                                    class="input"
                                    type="number"
                                    bind:value={importedSong.Intro}
                                /></td
                            >
                            <td>
                                <div class="buttons has-addons are-small">
                                    <button
                                        class="button is-success"
                                        on:click={ImportSong}
                                    >
                                        <span class="icon"
                                            ><i class="fas fa-floppy-disk"
                                            ></i></span
                                        >
                                    </button>
                                </div>
                            </td>
                        </tr>
                    {/if}
                    {#each songs as song, idx}
                        <tr>
                            {#if song.Path == editedSong.Path}
                                <td
                                    ><input
                                        class="input"
                                        type="text"
                                        bind:value={editedSong.Name}
                                    />
                                </td>
                                <td
                                    ><input
                                        class="input"
                                        type="number"
                                        bind:value={editedSong.Tempo}
                                    /></td
                                >
                                <td
                                    ><input
                                        class="input"
                                        type="number"
                                        bind:value={editedSong.Length}
                                    /></td
                                >
                                <td
                                    ><input
                                        class="input"
                                        type="number"
                                        bind:value={editedSong.Intro}
                                    /></td
                                >
                                <td>
                                    <div class="buttons has-addons are-small">
                                        <button
                                            class="button is-success"
                                            on:click={() => SaveSong(idx)}
                                        >
                                            <span class="icon"
                                                ><i class="fas fa-floppy-disk"
                                                ></i></span
                                            >
                                        </button>
                                    </div>
                                </td>
                            {:else}
                                <td>{song.Name}</td>
                                <td>{song.Tempo}</td>
                                <td>{song.Length}</td>
                                <td>{song.Intro}</td>
                                <td>
                                    <div class="buttons has-addons are-small">
                                        <button
                                            class="button is-primary"
                                            on:click={() => (editedSong = song)}
                                        >
                                            <span class="icon"
                                                ><i class="fas fa-pen"
                                                ></i></span
                                            >
                                        </button>
                                        <button
                                            class="button is-danger"
                                            on:click={() =>
                                                DeleteSong(song.Path, idx)}
                                        >
                                            <span class="icon"
                                                ><i class="fas fa-trash"
                                                ></i></span
                                            >
                                        </button>
                                    </div>
                                </td>
                            {/if}
                        </tr>
                    {/each}
                </tbody>
            </table>
        </section>
        <footer class="modal-card-foot">
            <div class="buttons">
                <button
                    class="button is-success"
                    on:click={() => fileChooser.click()}
                    >Song Importieren</button
                >
                <input
                    type="file"
                    class="is-hidden"
                    bind:this={fileChooser}
                    bind:files={chosenFiles}
                    on:change={songChosen}
                />
            </div>
        </footer>
    </div>
</div>
