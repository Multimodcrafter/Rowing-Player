<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { DataStore } from "./data_manager";
    import {
        isTrainingInstance,
        PlayableTraining,
        SongInstance,
        Training,
    } from "./training";

    export let show: boolean = true;
    export let selectedTraining: PlayableTraining;

    let db: DataStore = new DataStore();
    let trainingList: Training[];
    const dispatch = createEventDispatcher();

    db.Initialize().then(async () => {
        trainingList = await db.GetAllTrainings();
    });

    async function resolveContent(
        training: Training,
        PauseSong: string,
    ): Promise<SongInstance[]> {
        let result: SongInstance[] = [];

        for (const entry of training.Content) {
            if (isTrainingInstance(entry)) {
                const subtraining = await db.GetTraining(entry.TrainingName);
                result = result.concat(
                    await resolveContent(subtraining, PauseSong),
                );
            } else {
                const newEntry = { ...entry };
                if (entry.IsPause) {
                    newEntry.SongName = PauseSong;
                }
                result.push(newEntry);
            }
        }

        return result;
    }

    async function SelectTraining(training: Training) {
        selectedTraining = {
            Name: training.Name,
            Content: await resolveContent(training, training.PauseSong),
        };
        show = false;
        dispatch("trainingSelected");
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
                                <button
                                    class="button is-primary"
                                    on:click={() => {
                                        SelectTraining(training);
                                    }}
                                >
                                    <span class="icon"
                                        ><i class="fas fa-circle-play"
                                        ></i></span
                                    >
                                </button>
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </section>
        <footer class="modal-card-foot"></footer>
    </div>
</div>
