<script lang="ts">
    import { createEventDispatcher } from "svelte";
    export let trainingList: string[];
    export let chosenTraining: string = "";

    const dispatch = createEventDispatcher();
</script>

<div class="notification is-light">
    <div class="field has-addons">
        <div class="control">
            <div class="select">
                <select bind:value={chosenTraining}>
                    {#each trainingList as training}
                        <option>{training}</option>
                    {/each}
                </select>
            </div>
        </div>
        <div class="control">
            <button class="button is-primary" on:click={() => dispatch("up")}
                ><span class="icon"><i class="fas fa-chevron-up"></i></span
                ></button
            >
        </div>
        <div class="control">
            <button class="button is-primary" on:click={() => dispatch("down")}
                ><span class="icon"><i class="fas fa-chevron-down"></i></span
                ></button
            >
        </div>
        <div class="control">
            <button class="button is-danger" on:click={() => dispatch("delete")}
                ><span class="icon"><i class="fas fa-trash"></i></span></button
            >
        </div>
    </div>
</div>
