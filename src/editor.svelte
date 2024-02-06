<script lang="ts">
    import FileEntry from "./file_entry.svelte";
    import SongEntry from "./song_entry.svelte";
    import {VERSION} from "./sw.js"
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
                    <FileEntry />
                    <FileEntry songTempo={60} songIntro={50} />
                    <button class="button is-primary is-fullwidth">Song hinzufügen</button>
                </div>

                <div class="box">
                    <SongEntry songList={["test1", "test2"]}/>
                    <button class="button is-primary is-fullwidth">Song hinzufügen</button>
                </div>
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