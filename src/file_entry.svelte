<script lang="ts">
    import { createEventDispatcher } from "svelte";

    export let songPath: string = "";
    export let songName: string = "";
    export let songTempo: number = 20;
    export let songIntro: number = 0;

    let chosenFiles: FileList;
    let fileChooser: HTMLElement;

    const dispatch = createEventDispatcher();

    function songChosen() {
        if(!chosenFiles) return;
        songPath = chosenFiles[0].name;
        songName = songPath;
        dispatch('songchange');
    }

</script>

<div class="field has-addons">
    <div class="control">
        <button class="button is-primary" on:click={() => fileChooser.click()}>Datei wählen</button>
        <input type="file" class="is-hidden" bind:this={fileChooser} bind:files={chosenFiles} on:change={songChosen}/>
    </div>
    <div class="control">
        <input class="input" type="text" bind:value={songName}/>
    </div>
    <div class="control">
        <input class="input" type="number" bind:value={songTempo}/>
    </div>
    <div class="control">
        <input class="input" type="number" bind:value={songIntro}/>
    </div>
    <div class="control">
        <button class="button is-danger" on:click><span class="icon"><i class="fas fa-trash"></i></span></button>
    </div>
</div>