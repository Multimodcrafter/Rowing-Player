<script lang="ts">
    import FileEntry from "./file_entry.svelte";
    import SongEntry from "./song_entry.svelte";
    import {VERSION} from "./sw.js"
    import { Display, Song } from "./training";

    interface SongInstance {
        Instructions: Display[];
        SongPath: string;
    }

    let songNameList: string[] = [];
    let songList: Song[] = [];
    let contentList: SongInstance[] = [];

    function addSong() {
        songList.push({Path: "", Name: "", Tempo: 80, Instructions: [], Intro: 0});
        //update interface
        songList = songList;
    }

    function removeSong(idx: number) {
        songList.splice(idx, 1);
        updateNameList();
        //update interface
        songList = songList;
    }

    function updateNameList() {
        const newList = songList.map((x) => x.Path);
        if (songNameList.length < songList.length) {
            addContent();
            contentList[contentList.length - 1].SongPath = newList[newList.length - 1];
        }
        songNameList = newList;
    }

    function addContent() {
        if(songList.length == 0) return;
        contentList.push({SongPath: songList[0].Path, Instructions: []});
        //update interface
        contentList = contentList;
    }

    function removeContent(idx: number) {
        contentList.splice(idx, 1);
        //update interface
        contentList = contentList;
    }

    function swapArrayElements(array: any[], idx1: number, idx2: number) {
        [array[idx1], array[idx2]] = [array[idx2], array[idx1]];
    }

    function moveContentUp(idx: number) {
        if (idx > 0) {
            swapArrayElements(contentList, idx, idx - 1);
            //update interface
            contentList = contentList;
        }
    }

    function moveContentDown(idx: number) {
        if (idx < contentList.length - 1) {
            swapArrayElements(contentList, idx, idx + 1);
            //update interface
            contentList = contentList;
        }
    }

</script>

<section class="section">
    <div class="container">
        <div class="columns is-centered">
            <div class="column is-half">
                <div class="box">
                    <h1 class="title">Editor</h1>
                    <a class="button is-primary is-fullwidth" href="/">Zurück zum Player</a>
                </div>

                <div class="box">
                    {#each songList as song, idx}
                        <FileEntry bind:songName={song.Name} 
                                   bind:songPath={song.Path}
                                   bind:songTempo={song.Tempo}
                                   bind:songIntro={song.Intro}
                                   on:click={() => removeSong(idx)}
                                   on:songchange={updateNameList}/>
                    {/each}
                    <button class="button is-success is-fullwidth" on:click={addSong}>Song hinzufügen</button>
                </div>

                {#if contentList.length > 0}
                <div class="box">
                    {#each contentList as content, idx}
                        <SongEntry
                            songList={songNameList}
                            bind:instructions={content.Instructions}
                            bind:chosenSong={content.SongPath}
                            on:up={() => moveContentUp(idx)}
                            on:down={() => moveContentDown(idx)}
                            on:delete={() => removeContent(idx)}/>
                    {/each}
                    <button class="button is-success is-fullwidth" on:click={addContent}>Wiederholung hinzufügen</button>
                </div>
                {/if}
            </div>
        </div>
    </div>
</section>
<footer class="footer">
    <div class="content has-text-centered">
        <p>
            Rowing Player by Robin Hänni
        </p>
        <p class="has-text-centered content has-text-light" id="version-display">v{VERSION}</p>
    </div>
</footer>