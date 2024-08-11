<script lang="ts">
    import SongEntry from "./song_entry.svelte";
    import { VERSION } from "./sw.js";
    import {
        isSongInstance,
        Song,
        SongInstance,
        Training,
        TrainingInstance,
    } from "./training";
    import { DataStore } from "./data_manager";
    import TrainingEntry from "./training_entry.svelte";
    import SongBrowser from "./song_browser.svelte";
    import TrainingBrowser from "./training_browser.svelte";

    let songList: Song[] = [];
    let trainingList: Training[] = [];
    let templateTrainingList: Training[] = [];
    let editedTraining: Training = {
        Content: [],
        IsTemplate: false,
        Name: "",
        PauseSong: "",
    };
    let showSongBrowser: boolean = false;
    let showTrainingBrowser: boolean = true;
    let db: DataStore = new DataStore();
    db.Initialize()
        .then(() => db.GetAllSongs())
        .then((loadedSongs) => {
            songList = loadedSongs;
            return db.GetAllTrainings();
        })
        .then((loadedTrainings) => {
            trainingList = loadedTrainings;
            templateTrainingList = loadedTrainings.filter(
                (training) => training.IsTemplate,
            );
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

    async function saveTraining() {
        await db.StoreTraining(editedTraining);
        templateTrainingList = trainingList.filter(
            (training) => training.IsTemplate,
        );
        trainingList = trainingList;
        showTrainingBrowser = true;
    }
</script>

<section class="section">
    <div class="container">
        <div class="columns is-centered">
            <div class="column is-half">
                <div class="box">
                    <h1 class="title">Editor</h1>
                    <div class="field is-grouped">
                        <div class="field has-addons mb-0">
                            <div class="control">
                                <button class="button is-static"
                                    >Pause Song:</button
                                >
                            </div>
                            <div class="control">
                                <div class="select">
                                    <select
                                        bind:value={editedTraining.PauseSong}
                                    >
                                        {#each songList as song}
                                            <option value={song.Name}
                                                >{song.Tempo} - {song.Name}</option
                                            >
                                        {/each}
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div class="buttons">
                            <button
                                class="button"
                                on:click={() => (showSongBrowser = true)}
                                >Songs Durchsuchen...</button
                            >
                        </div>
                    </div>
                </div>

                <div class="box">
                    {#each editedTraining.Content as content, idx}
                        {#if isSongInstance(content)}
                            <SongEntry
                                {songList}
                                isPause={content.IsPause}
                                bind:instructions={content.Instructions}
                                bind:chosenSong={content.SongName}
                                on:up={() => moveContentUp(idx)}
                                on:down={() => moveContentDown(idx)}
                                on:delete={() => removeContent(idx)}
                            />
                        {:else}
                            <TrainingEntry
                                trainingList={templateTrainingList}
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
                                    SongName: songList[0].Name,
                                    Instructions: [],
                                    IsPause: false,
                                })}>Song hinzufügen</button
                        >
                        <button
                            class="button is-success"
                            on:click={() =>
                                addContent({
                                    SongName: "",
                                    Instructions: [],
                                    IsPause: true,
                                })}>Pause hinzufügen</button
                        >
                        <button
                            class="button is-success"
                            on:click={() =>
                                addContent({
                                    TrainingName: trainingList[0].Name,
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
                        <div class="control">
                            <button
                                class="button is-danger"
                                on:click={() => (showTrainingBrowser = true)}
                                >Änderungen verwerfen</button
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

<SongBrowser bind:show={showSongBrowser} bind:songs={songList} {db} />
<TrainingBrowser
    bind:show={showTrainingBrowser}
    bind:trainingList
    bind:editedTraining
    {db}
/>
