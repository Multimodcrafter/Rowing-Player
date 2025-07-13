.PHONY: all serve test
all:
	npx webpack

serve:
	cd dist && npx http-server ./ -o ~haenniro/

test:
	rm test/training.zip
	cd test && zip -r training *

clean:
	rm -r dist