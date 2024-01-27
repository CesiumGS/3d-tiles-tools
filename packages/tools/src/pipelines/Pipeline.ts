import { TilesetStage } from "./TilesetStage";

/**
 * An interface that describes a pipeline of operations
 * that should be applied to tileset data.
 *
 * It consists of the input- and output definition, and a
 * set of `TilesetStage` steps that should be executed.
 * Instances of this are created with the `Pipelines`
 * class, and executed with a `PipelineExecutor`.
 *
 * @internal
 */
export interface Pipeline {
  /**
   * The name of the input tileset.
   *
   * This may be a path to a tileset JSON file, or a directory
   * name (which is then assumed to contain a `tileset.json`),
   * or a tileset package, as indicated by the file extension
   * being `.3tz` or `.3dtiles`.
   */
  input: string;

  /**
   * The name of the output tileset.
   *
   * (See `input` for details)
   */
  output: string;

  /**
   * The array of `TilesetStage` objects that will be
   * applied to the input data to eventually generate
   * the output data.
   */
  tilesetStages: TilesetStage[];
}
