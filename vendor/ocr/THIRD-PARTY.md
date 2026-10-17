# OCR dependencies

- Tesseract.js 7.0.0: https://github.com/naptha/tesseract.js (Apache-2.0); browser distribution and worker from npm tesseract.js@7.0.0. Preserve TESSERACT-LICENSE.txt and bundled *.LICENSE.txt.
- Tesseract.js-core 7.0.0: https://github.com/naptha/tesseract.js-core (Apache-2.0); embedded-WASM JavaScript builds from npm tesseract.js-core@7.0.0. See CORE-LICENSE.txt.
- English trained data (eng/4.0.0_best_int): https://github.com/naptha/tessdata ; source https://cdn.jsdelivr.net/npm/@tesseract.js-data/eng/4.0.0_best_int/eng.traineddata.gz . Model is vendored, not downloaded from CDN at runtime. Tesseract language data upstream: https://github.com/tesseract-ocr/tessdata (Apache-2.0).

See SHA256.json for shipped asset digests. No npm installation is required on a static host. Development-only pngjs and npm package tree are outside the publish directory.
