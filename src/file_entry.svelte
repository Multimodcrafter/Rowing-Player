<script lang="ts">
    export let songPath: string = "";
    export let songName: string = "";
    export let songTempo: number = 80;
    export let songIntro: number = 0;

    let chosenFiles: FileList;
    let fileChooser: HTMLElement;

    function songChosen() {
        console.log("changed");
        if(!chosenFiles) return;
        songPath = chosenFiles[0].name;
        console.log("song: " + songPath);
        if(songName == "") {
            songName = songPath;
        }
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