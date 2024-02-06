<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import DisplayEntry from "./display_entry.svelte";
    import { Display } from "./training";
    export let songList: string[];
    export let instructions: Display[] = [];
    export let chosenSong: string = "";

    const dispatch = createEventDispatcher();

    function addInstruction() {
        instructions.push({Text: "", Time: 0});
        // update interface
        instructions = instructions;
    }

    function removeInstruction(idx: number) {
        instructions.splice(idx, 1);
        //update interface
        instructions = instructions;
    }
</script>

<div class="notification is-light">
    <div class="field has-addons">
        <div class="control">
            <div class="select">
                <select bind:value={chosenSong}>
                    {#each songList as song}
                    <option>{song}</option>
                    {/each}
                </select>
            </div>
        </div>
        <div class="control">
            <button class="button is-primary" on:click={() => dispatch('up')}><span class="icon"><i class="fas fa-chevron-up"></i></span></button>
        </div>
        <div class="control">
            <button class="button is-primary" on:click={() => dispatch('down')}><span class="icon"><i class="fas fa-chevron-down"></i></span></button>
        </div>
        <div class="control">
            <button class="button is-success" on:click={addInstruction}>Text hinzufügen</button>
        </div>
        <div class="control">
            <button class="button is-danger" on:click={() => dispatch('delete')}><span class="icon"><i class="fas fa-trash"></i></span></button>
        </div>
    </div>
    {#if instructions.length > 0}
    <table class="table">
        <tbody>
            {#each instructions as inst, idx}
            <DisplayEntry bind:text={inst.Text} bind:time={inst.Time} on:click={()=>removeInstruction(idx)}/>
            {/each}
        </tbody>
    </table>
    {/if}
</div>