.PHONY: all serve test
all:
	npx tsc
	npx webpack

serve:
	npx live-server --open=./dist

test:
	rm test/training.zip
	cd test && zip -r training *