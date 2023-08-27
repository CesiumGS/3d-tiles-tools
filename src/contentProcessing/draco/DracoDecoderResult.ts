import { AttributeInfo } from "./AttributeInfo";

/**
 * The result from the draco decoder, mapping attribute names
 * to the decoded attribute data and information about the
 * attribute structure
 *
 * @internal
 */
export type DracoDecoderResult = {
  [key: string]: {
    attributeData: Buffer;
    attributeInfo: AttributeInfo;
  };
};
