To (re-)create the android project run:

```bash
docker run --rm -ti -v .:/app ghcr.io/googlechromelabs/bubblewrap:latest init --manifest=https://spaceempire.vsos.ethz.ch/~haenniro/rowingplayer.json
```

Then build it by running:

```bash
docker run --rm -ti -v .:/app ghcr.io/googlechromelabs/bubblewrap:latest build
```

Password for keystore and key are the same and stored in password manager