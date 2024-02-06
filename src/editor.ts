import * as JSZip from "jszip";
import {VERSION} from "./sw";
import { Song, Training, Display } from "./training";

function initialize() {
    console.log("Hello from rowing player editor");
    const versionDisplay = document.getElementById("version-display")
    if(versionDisplay) versionDisplay.innerText = `v${VERSION}`;
}

initialize();