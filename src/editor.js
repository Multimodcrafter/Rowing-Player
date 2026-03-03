import { mount } from 'svelte'
import App from './editor.svelte'

const app = mount(App, {
    target: document.body
})

window.app = app;

export default app;