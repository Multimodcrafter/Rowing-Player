.PHONY: all serve test
all:
	npx webpack

serve:
	npx live-server --open=./dist

test:
	rm test/training.zip
	cd test && zip -r training *