// TODO DUMMY for the content type detection
// that may be carved out of the validator
export class ContentTypes_Dummy {
  static isProbablyTileset(uri: string) {
    return uri.toLowerCase().endsWith(".json");
  }
}
