/* eslint-disable */
/**
 * This file was automatically generated by json-schema-to-typescript.
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema file,
 * and run json-schema-to-typescript to regenerate this file.
 */

export type Rule =
  | "any"
  | string[]
  | {
      roles?: string[];
      /**
       * IP addresses can also contain wildcards: ? for s single digit, * for single segments and ** for multiple segments
       */
      ips?: string[];
    };

export interface MashroomSecurityAcl {
  $schema?: any;
  /**
   * The path can contain the wildcard * for single segments and ** for multiple segments
   *
   * This interface was referenced by `MashroomSecurityAcl`'s JSON-Schema definition
   * via the `patternProperty` "^/.*$".
   */
  [k: string]: {
    /**
     * This interface was referenced by `undefined`'s JSON-Schema definition
     * via the `patternProperty` "^(\*|GET|POST|PUT|DELETE|PATCH|OPTIONS)$".
     */
    [k: string]: {
      allow?: Rule;
      deny?: Rule;
    };
  };
}
