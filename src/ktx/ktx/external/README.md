These files are built from 
https://github.com/BinomialLLC/basis_universal/blob/ad9386a4a1cf2a248f7bbd45f543a7448db15267/webgl/encoder
with one modification: 

The original linker flags in `\basis_universal\webgl\encoder\CMakeLists.txt` had been

`LINK_FLAGS "--bind -s ALLOW_MEMORY_GROWTH=1 -O3 -s ASSERTIONS=0 -s INITIAL_MEMORY=299958272 -s MALLOC=emmalloc -s MODULARIZE=1 -s EXPORT_NAME=BASIS")`

When building the files with these flags and using them in the `BinomialLLC\basis_universal\webgl\encode_test`,
then selecting `UASTC` caused a `RuntimeError: memory access out of bounds` error. This was most likely related
to the issue at https://github.com/emscripten-core/emscripten/issues/19268#issuecomment-1544298860 (boiling down
to a stack overflow). Adding a `STACK_SIZE=...` to the linker flags seemed to fix this:

`LINK_FLAGS "--bind -s ALLOW_MEMORY_GROWTH=1 -O3 -s ASSERTIONS=0 -s INITIAL_MEMORY=299958272 -s MALLOC=emmalloc -s MODULARIZE=1 -s EXPORT_NAME=BASIS -s STACK_SIZE=10MB")`

