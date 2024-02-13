<script lang="ts">
    import { createEventDispatcher } from "svelte";

    export let songPath: string = "";
    export let songName: string = "";
    export let songTempo: number = 20;
    export let songIntro: number = 0;
    export let songFile: File = new File([], "");

    let chosenFiles: FileList;
    let fileChooser: HTMLElement;
    const audioContext = new AudioContext();

    const dispatch = createEventDispatcher();

    async function checkFile() {
        const array_buffer = await songFile.arrayBuffer();
        if(!array_buffer) throw `Could not load '${songPath} as array buffer`;
        const audio_buffer = await audioContext.decodeAudioData(array_buffer);
        if(!audio_buffer) throw `Could not load '${songPath}' as audio file`;
        let roundedDuration = Math.round(audio_buffer.duration / 10) * 10;
        if (Math.abs(roundedDuration - audio_buffer.duration) > 0.1) {
            console.warn(`${songPath} is ${audio_buffer.duration} seconds long`);
        } else {
            console.log(`${songPath} is ok (${audio_buffer.duration} seconds long)`);
        }
    }

    function songChosen() {
        const nameRe = /^(\d\d)(_\d+_)(.*)(\..*)/;
        if(!chosenFiles) return;
        songPath = chosenFiles[0].name;
        const nameGroups = songPath.match(nameRe);
        if(nameGroups) {
            songName = `${nameGroups[1]} - ${nameGroups[3]}`;
        } else {
            songName = songPath;
        }
        songFile = chosenFiles[0];
        if(nameGroups) songTempo = Number.parseInt(nameGroups[1]);
        checkFile();
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