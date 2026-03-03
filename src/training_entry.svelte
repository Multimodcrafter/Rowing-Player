<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { Training } from "./training";
    export let trainingList: Training[];
    export let chosenTraining: string = "";

    const dispatch = createEventDispatcher();
</script>

<div class="notification mb-2 p-3">
    <div class="field has-addons">
        <div class="control">
            <div class="select">
                <select bind:value={chosenTraining}>
                    {#each trainingList as training}
                        <option value={training.Name}>{training.Name}</option>
                    {/each}
                </select>
            </div>
        </div>
        <div class="control">
            <button class="button is-primary" on:click={() => dispatch("up")}
                aria-label="Eintrag nach oben verschieben"
                ><span class="icon"><i class="fas fa-chevron-up"></i></span
                ></button
            >
        </div>
        <div class="control">
            <button class="button is-primary" on:click={() => dispatch("down")}
                aria-label="Eintrag nach unten verschieben"
                ><span class="icon"><i class="fas fa-chevron-down"></i></span
                ></button
            >
        </div>
        <div class="control">
            <button class="button is-danger" on:click={() => dispatch("delete")}
                aria-label="Eintrag löschen"
                ><span class="icon"><i class="fas fa-trash"></i></span></button
            >
        </div>
    </div>
</div>
