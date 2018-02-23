import { Formattable, Leaf } from './blot';
import ShadowBlot from './shadow';
import * as Registry from '../../registry';

/**
 * A Blot that can retreive a value from it's DOM Node.
*/
class LeafBlot extends ShadowBlot implements Leaf {

  /** @inheritDoc */
  static scope = Registry.Scope.INLINE_BLOT;

  /**
   * Get the value represented by DOM Node if it is this Blot's type.
   *
   * This function does not check that the DOM Node is actually of the current type
   * so using this function will require doing that validation externally.
   *
   * @param domNode - the DOM Node to check.
   */
  static value(domNode: Node): any {
    return true;
  }

  /**
   * Given location represented by node and offset from DOM Selection Range,
   * return index to that location.
   *
   * @param node - The node to check.
   * @param offset - The offset to return if the DOM Node and selection match.
   */
  index(node: Node, offset: number): number {
    if (
      this.domNode === node ||
      this.domNode.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_CONTAINED_BY
    ) {
      return Math.min(offset, 1);
    }
    return -1;
  }

  /**
   * Given index to location within blot, return node and offset representing
   * that location, consumable by DOM Selection Range
   */
  position(index: number, inclusive?: boolean): [Node, number] {
    let offset = [].indexOf.call(this.parent.domNode.childNodes, this.domNode);
    if (index > 0) offset += 1;
    return [this.parent.domNode, offset];
  }

  /**
   * Get the value represented by this Blot. The value should not change without interaction
   * from the API or a user change detectable by update().
   */
  value(): any {
    return { [this.statics.blotName]: this.statics.value(this.domNode) || true };
  }
}

export default LeafBlot;
