import { ClassProperty } from "../structure/Metadata/ClassProperty";

export class TileTablePropertiesPnts {
  private static readonly globalProperties: { [key: string]: ClassProperty } = {
    POINTS_LENGTH: {
      type: "SCALAR",
      componentType: "UINT32",
    },
    RTC_CENTER: {
      type: "VEC3",
      componentType: "FLOAT32",
    },
    QUANTIZED_VOLUME_OFFSET: {
      type: "VEC3",
      componentType: "FLOAT32",
    },
    QUANTIZED_VOLUME_SCALE: {
      type: "VEC3",
      componentType: "FLOAT32",
    },
    CONSTANT_RGBA: {
      type: "VEC4",
      componentType: "UINT8",
    },
    BATCH_LENGTH: {
      type: "SCALAR",
      componentType: "UINT32",
    },
  };

  private static readonly perPointProperties: { [key: string]: ClassProperty } =
    {
      POSITION: {
        type: "VEC3",
        componentType: "FLOAT32",
      },
      POSITION_QUANTIZED: {
        type: "VEC3",
        componentType: "UINT16",
      },
      RGBA: {
        type: "VEC4",
        componentType: "UINT8",
      },
      RGB: {
        type: "VEC3",
        componentType: "UINT8",
      },
      RGB565: {
        type: "SCALAR",
        componentType: "UINT16",
      },
      NORMAL: {
        type: "VEC3",
        componentType: "FLOAT32",
      },
      NORMAL_OCT16P: {
        type: "VEC2",
        componentType: "UINT8",
      },
      BATCH_ID: {
        type: "SCALAR",
        componentType: "UINT16",
      },
    };

  static getGlobal(semantic: string): ClassProperty | undefined {
    return TileTablePropertiesPnts.globalProperties[semantic];
  }
  static get(semantic: string): ClassProperty | undefined {
    return TileTablePropertiesPnts.perPointProperties[semantic];
  }
}


