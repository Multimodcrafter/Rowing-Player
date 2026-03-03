import { mount } from 'svelte'
import App from './player.svelte'

const app = mount(App, {
    target: document.body
})

window.app = app;

export default app;