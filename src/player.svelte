<script lang="ts">
    import { RenderInfo, AudioPlayer } from "./audio_player";
    import { VERSION } from "./sw";
    import { PlayableTraining } from "./training";
    import TrainingSelector from "./training_selector.svelte";
    require("./mystyles.scss");

    let player = new AudioPlayer(showMessage);
    let renderInfo: RenderInfo;
    let remMinutes = 0;
    let remSeconds = 0;
    let messageBody = "";
    let messageIsError = false;
    let messageVisible = false;
    let wakeLock: WakeLockSentinel | null = null;
    let wakeLockSupported = true;
    let showTrainingSelector = false;
    let selectedTraining: PlayableTraining;

    async function requestWakeLock() {
        if (!wakeLockSupported || (wakeLock !== null && !wakeLock.released))
            return;
        if (!("wakeLock" in navigator)) {
            showMessage(
                "Dein Browser hat keine Wakelock-Unterstützung. Das bedeutet, dass ich nicht verhindern kann, dass sich der Bildschirm deines Geräts nach einer gewissen Zeit ausschaltet. Denke daran immer mal wieder den Bildschirm zu berühren (sofern du ein Gerät mit Touchscreen hast).",
                false,
            );
            wakeLockSupported = false;
            return;
        }
        try {
            wakeLock = await navigator.wakeLock.request("screen");
        } catch (err) {
            showMessage(`${err}`, true);
        }
    }

    async function releaseWakeLock() {
        if (!wakeLockSupported || !wakeLock || wakeLock.released) return;
        await wakeLock.release();
        wakeLock = null;
    }

    function showMessage(body: string, isError: boolean) {
        messageBody = body;
        messageIsError = isError;
        messageVisible = true;
    }

    function dismissMessage() {
        messageVisible = false;
    }

    async function render() {
        renderInfo = await player.render();
        remMinutes = Math.floor(renderInfo.remaining / 60);
        remSeconds = Math.ceil(renderInfo.remaining % 60);
        if (remSeconds == 60) {
            remMinutes += 1;
            remSeconds = 0;
        }
        if (player.isPlaying()) {
            requestWakeLock();
            document.documentElement.classList.add("prevent-overscroll");
        } else {
            releaseWakeLock();
            document.documentElement.classList.remove("prevent-overscroll");
        }
        player = player;
        window.requestAnimationFrame(render);
    }

    async function playPause() {
        if (player.isPlaying()) {
            player.pause();
        } else {
            await player.play();
        }
    }

    function reset() {
        player.reset();
    }

    async function next() {
        await player.playNext();
    }

    async function previous() {
        await player.playPrevious();
    }

    function preventAccidentalNavigation(event: Event) {
        if (player.isPlaying()) {
            event.preventDefault();
            event.returnValue = true;
        }
    }

    function initialize() {
        window.requestAnimationFrame(render);
        addEventListener("beforeunload", preventAccidentalNavigation);
    }

    initialize();
</script>

<section class="section">
    <div class="container">
        <div class="columns is-centered">
            <div class="column is-half">
                <article
                    class="message"
                    id="message-box"
                    class:is-warning={!messageIsError}
                    class:is-danger={messageIsError}
                    class:is-hidden={!messageVisible}
                >
                    <div class="message-header">
                        <p id="message-title">
                            {messageIsError ? "Fehler" : "Warnung"}
                        </p>
                        <button
                            class="delete"
                            id="message-dismiss"
                            on:click={dismissMessage}
                        ></button>
                    </div>
                    <div class="message-body" id="message-body">
                        {messageBody}
                    </div>
                </article>

                <div
                    class="box"
                    id="heading-box"
                    class:is-hidden={player.isPlaying()}
                >
                    <h1 class="title is-5">
                        Rowing Player - <span id="training-name-display"
                            >{renderInfo.TrainingName}</span
                        >
                    </h1>
                    <button
                        class="button is-danger is-fullwidth"
                        id="file-selector-button"
                        disabled={player.isBusy() || player.isPlaying()}
                        class:is-loading={player.isBusy()}
                        on:click={() => {
                            showTrainingSelector = true;
                        }}
                    >
                        <span class="icon">
                            <i class="fas fa-folder-open"></i>
                        </span>
                        <span>Training Laden</span>
                    </button>
                    <input class="is-hidden" type="file" id="file-selector" />
                </div>

                <div
                    class="box {renderInfo.displaycountdown > 0 &&
                    renderInfo.displaytext != ''
                        ? ''
                        : 'is-hidden'}"
                    id="instruction-display"
                >
                    <p
                        id="instruction-text"
                        class="has-text-weight-bold is-size-4"
                    >
                        {renderInfo.displaytext} - {renderInfo.displaycountdown}
                    </p>
                </div>

                <div class="box">
                    <div
                        class="columns is-centered {renderInfo.introcountdown >
                        0
                            ? ''
                            : 'is-hidden'} is-mobile"
                        id="intro-display"
                    >
                        <p class="column is-narrow" id="intro-text">
                            Vorlauf - Start in {renderInfo.introcountdown}
                        </p>
                    </div>
                    <div class="columns is-centered is-mobile">
                        <p
                            class="column is-narrow is-size-1 has-text-weight-bold"
                            id="beat-display"
                        >
                            {renderInfo.beat.toString()}
                        </p>
                    </div>
                </div>

                <div class="box">
                    <p class="block">
                        <span id="name-display">{renderInfo.SongName}</span> -
                        <span id="remaining-display"
                            >{`${remMinutes}:${remSeconds.toString().padStart(2, "0")}`}</span
                        >
                    </p>
                    <progress
                        id="remaining-indicator"
                        value={(renderInfo.completion * 100).toString()}
                        max="100"
                        class="progress is-primary block"
                    ></progress>
                </div>

                <div class="box">
                    <div class="buttons is-centered">
                        <button
                            class="button is-light is-rounded"
                            id="previous-button"
                            disabled={player.isBusy() || !player.isPlaying()}
                            on:click={previous}
                        >
                            <span class="icon">
                                <i class="fas fa-backward-step fa-lg"></i>
                            </span>
                        </button>
                        <button
                            class="button is-primary is-rounded is-large"
                            id="play-button"
                            disabled={player.isBusy()}
                            class:is-loading={player.isBusy()}
                            on:click={playPause}
                        >
                            <span class="icon">
                                <i
                                    class="fas fa-lg"
                                    class:fa-play={!player.isPlaying()}
                                    class:fa-pause={player.isPlaying()}
                                ></i>
                            </span>
                        </button>
                        <button
                            class="button is-light is-rounded"
                            id="next-button"
                            disabled={player.isBusy() || !player.isPlaying()}
                            on:click={next}
                        >
                            <span class="icon">
                                <i class="fas fa-forward-step fa-lg"></i>
                            </span>
                        </button>
                    </div>
                    <button
                        class="button is-danger"
                        id="reset-button"
                        disabled={player.isBusy() || player.isPlaying()}
                        on:click={reset}
                    >
                        Reset
                    </button>
                </div>
                <div class="box">
                    <a
                        class="button is-primary is-fullwidth"
                        href="/~haenniro/editor.html">Trainings Editor</a
                    >
                </div>
            </div>
        </div>
    </div>
</section>
<footer class="footer">
    <div class="content has-text-centered">
        <p>Rowing Player by Robin Hänni</p>
        <p class="has-text-centered content has-text-light">
            v{VERSION}
        </p>
    </div>
</footer>

<TrainingSelector
    bind:show={showTrainingSelector}
    bind:selectedTraining
    on:trainingSelected={() => {
        player.chooseTraining(selectedTraining);
    }}
></TrainingSelector>
