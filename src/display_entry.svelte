<script lang="ts">
    export let text: string = "";
    export let time: number = 0;
</script>

<tr>
    <td><input class="input" type="text" bind:value={text} /></td>
    <td
        ><input
            class="input"
            type="number"
            bind:value={time}
            on:input={() => {
                if (time === null) time = 0;
            }}
        /></td
    >
    <td
        ><button class="button is-danger" on:click
            ><span class="icon"><i class="fas fa-trash"></i></span></button
        ></td
    >
</tr>
