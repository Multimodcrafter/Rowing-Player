<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import DisplayEntry from "./display_entry.svelte";
    import { Display, Song } from "./training";
    export let songList: Song[];
    export let instructions: Display[] = [];
    export let chosenSong: string = "";
    export let volume: number = 1;
    export let isPause: boolean;

    const dispatch = createEventDispatcher();

    function addInstruction() {
        instructions.push({ Text: "", Time: 0 });
        // update interface
        instructions = instructions;
    }

    function removeInstruction(idx: number) {
        instructions.splice(idx, 1);
        //update interface
        instructions = instructions;
    }
</script>

<div class="notification p-2 mb-2">
    <div class="field has-addons">
        {#if isPause}
            <div class="control">
                <button class="button is-static is-small" style="width: 120px;"
                    >Pause</button
                >
            </div>
        {:else}
            <div class="control">
                <div class="select is-small" style="width: 120px;">
                    <select bind:value={chosenSong} style="width: 120px;">
                        {#each songList as song}
                            <option value={song.Name}
                                >{song.Tempo} - {#if song.Intro > 0}v{/if}{song.Length}
                                - {song.Name}</option
                            >
                        {/each}
                    </select>
                </div>
            </div>
        {/if}
        <div class="control">
            <button class="button is-static is-small">Volume:</button>
        </div>
        <div class="control">
            <input
                class="input is-small"
                type="number"
                step="0.1"
                max="1"
                min="0"
                style="width: 60px;"
                bind:value={volume}
            />
        </div>
        <div class="control">
            <button
                class="button is-primary is-small"
                on:click={() => dispatch("up")}
                ><span class="icon"><i class="fas fa-chevron-up"></i></span
                ></button
            >
        </div>
        <div class="control">
            <button
                class="button is-primary is-small"
                on:click={() => dispatch("down")}
                ><span class="icon"><i class="fas fa-chevron-down"></i></span
                ></button
            >
        </div>
        <div class="control">
            <button class="button is-success is-small" on:click={addInstruction}
                ><span class="icon"><i class="fas fa-list-check"></i></span
                ></button
            >
        </div>
        <div class="control">
            <button
                class="button is-danger is-small"
                on:click={() => dispatch("delete")}
                ><span class="icon"><i class="fas fa-trash"></i></span></button
            >
        </div>
    </div>
    {#if instructions.length > 0}
        <table class="table is-narrow">
            <tbody>
                {#each instructions as inst, idx}
                    <DisplayEntry
                        bind:text={inst.Text}
                        bind:time={inst.Time}
                        on:click={() => removeInstruction(idx)}
                    />
                {/each}
            </tbody>
        </table>
    {/if}
</div>
