
A basic tileset consisting of dummy data, with a structure 
suitable for testing various aspects of the tileset 
processing.

A tile with content and multiple children, where one child 
contains multiple contents (with the same file name, but 
located in different directories), one content that appears
twice in different tiles (even though that may not make
sense - it is intended for tests), and a README.md that is 
unrelated to the tileset itself.

root.content.uri = tileA.b3dm
root.children[0].contents[0].uri = tileB.b3dm
root.children[0].contents[1].uri = sub/tileB.b3dm
root.children[1].content.uri = tileC.b3dm
root.children[2].content.uri = tileA.b3dm


