<script lang="ts">
    import * as JSZip from "jszip";
    import FileEntry from "./file_entry.svelte";
    import SongEntry from "./song_entry.svelte";
    import { VERSION } from "./sw.js";
    import {
        isSongInstance,
        Song,
        SongInstance,
        Training,
        TrainingInstance,
    } from "./training";
    import { DataStore, import_file } from "./data_manager";
    import TrainingEntry from "./training_entry.svelte";

    let songNameList: string[] = [];
    let songList: Song[] = [];
    let trainingList: Training[] = [];
    let trainingNameList: string[] = [];
    let editedTraining: Training = { Content: [], IsTemplate: false, Name: "" };
    let db: DataStore = new DataStore();
    db.Initialize()
        .then(() => db.GetAllSongs())
        .then((loadedSongs) => {
            songList = loadedSongs;
            songNameList = songList.map((song) => song.Name);
            return db.GetAllTrainings();
        })
        .then((loadedTrainings) => {
            trainingList = loadedTrainings.filter(
                (training) => training.IsTemplate,
            );
            trainingNameList = trainingList.map((training) => training.Name);
        });

    function addContent(content: SongInstance | TrainingInstance) {
        editedTraining.Content.push(content);
        //update interface
        editedTraining = editedTraining;
    }

    function removeContent(idx: number) {
        editedTraining.Content.splice(idx, 1);
        //update interface
        editedTraining = editedTraining;
    }

    function swapArrayElements(array: any[], idx1: number, idx2: number) {
        [array[idx1], array[idx2]] = [array[idx2], array[idx1]];
    }

    function moveContentUp(idx: number) {
        if (idx > 0) {
            swapArrayElements(editedTraining.Content, idx, idx - 1);
            //update interface
            editedTraining = editedTraining;
        }
    }

    function moveContentDown(idx: number) {
        if (idx < editedTraining.Content.length - 1) {
            swapArrayElements(editedTraining.Content, idx, idx + 1);
            //update interface
            editedTraining = editedTraining;
        }
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

    async function saveTraining() {
        await db.StoreTraining(editedTraining);
    }

    let result = "";

    async function import_song(evt: Event) {
        console.log("Import triggered");
        const picker = evt.target as HTMLInputElement;
        if (!picker.files) return;
        const fileName = picker.files[0].name;
        const song = {
            Intro: 0,
            Length: 0,
            Name: fileName,
            Path: fileName,
            Tempo: 0,
        };
        Promise.all([
            import_file(picker.files[0]),
            db.StoreSong(song).then(() => {
                songNameList.push(fileName);
                songNameList = songNameList;
                songList.push(song);
                songList = songList;
            }),
        ])
            .then((val) => {
                result = `Success: ${val}`;
            })
            .catch((reason) => (result = `Error: ${reason}`));
    }
</script>

<section class="section">
    <div class="container">
        <div class="columns is-centered">
            <div class="column is-half">
                <div class="box">
                    <h1 class="title">Editor</h1>
                    <a class="button is-primary is-fullwidth" href="/~haenniro/"
                        >Zurück zum Player</a
                    >
                    <input type="file" on:change={import_song} />
                    <p>{result}</p>
                </div>

                <div class="box">
                    {#each editedTraining.Content as content, idx}
                        {#if isSongInstance(content)}
                            <SongEntry
                                songList={songNameList}
                                bind:instructions={content.Instructions}
                                bind:chosenSong={content.SongName}
                                on:up={() => moveContentUp(idx)}
                                on:down={() => moveContentDown(idx)}
                                on:delete={() => removeContent(idx)}
                            />
                        {:else}
                            <TrainingEntry
                                trainingList={trainingNameList}
                                bind:chosenTraining={content.TrainingName}
                                on:up={() => moveContentUp(idx)}
                                on:down={() => moveContentDown(idx)}
                                on:delete={() => removeContent(idx)}
                            />
                        {/if}
                    {/each}
                    <div class="buttons">
                        <button
                            class="button is-success"
                            on:click={() =>
                                addContent({
                                    SongName: songNameList[0],
                                    Instructions: [],
                                })}>Song hinzufügen</button
                        >
                        <button
                            class="button is-success"
                            on:click={() =>
                                addContent({
                                    TrainingName: trainingNameList[0],
                                })}>Trainingsblock hinzufügen</button
                        >
                    </div>
                </div>

                <div class="box">
                    <div class="field">
                        <label class="control">
                            <input
                                type="checkbox"
                                bind:checked={editedTraining.IsTemplate}
                            />
                            Dieses Training fungiert als wiederverwendbarer Block
                        </label>
                    </div>
                    <div class="field has-addons">
                        <div class="control is-expanded">
                            <input
                                type="text"
                                class="input"
                                placeholder="Training name"
                                bind:value={editedTraining.Name}
                            />
                        </div>
                        <div class="control">
                            <button
                                class="button is-success"
                                on:click={saveTraining}
                                >Training speichern</button
                            >
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</section>
<footer class="footer">
    <div class="content has-text-centered">
        <p>Rowing Player by Robin Hänni</p>
        <p
            class="has-text-centered content has-text-light"
            id="version-display"
        >
            v{VERSION}
        </p>
    </div>
</footer>
