<script lang="ts">
    export let text: string = "";
    export let time: number = 0;
</script>

<tr>
    <td><input class="input" type="text" bind:value={text}/></td>
    <td><input class="input" type="number" bind:value={time}/></td>
    <td><button class="button is-danger" on:click><span class="icon"><i class="fas fa-trash"></i></span></button></td>
</tr>