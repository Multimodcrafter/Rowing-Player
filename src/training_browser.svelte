<script lang="ts">
    import * as JSZip from "jszip";
    import { DataStore } from "./data_manager";
    import { Training } from "./training";

    export let show: boolean = true;
    export let trainingList: Training[] = [];
    export let editedTraining: Training;
    export let db: DataStore;

    let fileChooser: HTMLElement;
    let chosenFiles: FileList;

    async function DeleteTraining(name: string, idx: number) {
        await db.DeleteTraining(name);
        trainingList.splice(idx, 1);
        trainingList = trainingList;
    }

    function NewTraining() {
        editedTraining = {
            Name: "Neues Training",
            Content: [],
            IsTemplate: false,
            PauseSong: "",
        };
        trainingList.push(editedTraining);
        trainingList = trainingList;
        show = false;
    }

    async function ExportTraining(evt: Event, training: string) {
        const button = evt.target as HTMLButtonElement;
        button.classList.add("is-loading");
        await db.ExportTraining(training);
        button.classList.remove("is-loading");
    }

    async function ImportTraining(evt: Event) {
        if (!chosenFiles) return;
        const button = evt.target as HTMLButtonElement;
        button.classList.add("is-loading");
        const zip = new JSZip();
        const archive = await zip.loadAsync(chosenFiles[0]);
        await db.ImportTraining(archive);
        location.reload();
    }
</script>

<div class="modal {show ? 'is-active' : ''}">
    <div class="modal-background"></div>
    <div class="modal-card">
        <header class="modal-card-head">
            <p class="modal-card-title">Trainings</p>
        </header>
        <section class="modal-card-body">
            <table class="table">
                <thead>
                    <th>Training</th>
                    <th>Ist Vorlage</th>
                    <th style="width: 120px;"></th>
                </thead>
                <tbody>
                    {#each trainingList as training, idx}
                        <tr>
                            <td>{training.Name}</td>
                            <td>
                                <span
                                    class="icon {training.IsTemplate
                                        ? 'has-text-success'
                                        : 'has-text-danger'}"
                                >
                                    <i
                                        class="fas {training.IsTemplate
                                            ? 'fa-check'
                                            : 'fa-xmark'}"
                                    ></i>
                                </span>
                            </td>
                            <td>
                                <div class="buttons has-addons are-small">
                                    <button
                                        class="button is-primary"
                                        on:click={() => {
                                            editedTraining = training;
                                            show = false;
                                        }}
                                    >
                                        <span class="icon"
                                            ><i class="fas fa-pen"></i></span
                                        >
                                    </button>
                                    <button
                                        class="button is-info"
                                        on:click={(evt) => {
                                            ExportTraining(evt, training.Name);
                                        }}
                                    >
                                        <span class="icon"
                                            ><i class="fas fa-file-export"
                                            ></i></span
                                        >
                                    </button>
                                    <button
                                        class="button is-danger"
                                        on:click={() =>
                                            DeleteTraining(training.Name, idx)}
                                    >
                                        <span class="icon"
                                            ><i class="fas fa-trash"></i></span
                                        >
                                    </button>
                                </div>
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </section>
        <footer class="modal-card-foot">
            <div class="buttons">
                <button class="button is-success" on:click={NewTraining}
                    >Neues Training erstellen</button
                >
                <button
                    class="button is-info"
                    on:click={() => fileChooser.click()}
                    >Training importieren</button
                >
                <input
                    type="file"
                    class="is-hidden"
                    bind:this={fileChooser}
                    bind:files={chosenFiles}
                    on:change={ImportTraining}
                />
                <a class="button is-primary" href="/"
                    >Zurück zum Player</a
                >
            </div>
        </footer>
    </div>
</div>
