cd kevsjuce/KevsAudioPlugin/JUCE || exit 1
cmake . -B cmake-build-debug -DJUCE_BUILD_EXAMPLES=ON -DJUCE_BUILD_EXTRAS=ON
cmake --build cmake-build-debug --target DemoRunner
cd cmake-build-debug || exit 1
make -j $(nproc)
