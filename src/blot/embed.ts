import { Formattable } from './abstract/blot';
import LeafBlot from './abstract/leaf';

/**
 * Basic implementation of a non-text leaf blot, that is formattable.
 *
 * Its corresponding DOM node will often be a Void Element, but can be a Normal Element.
 * @see https://www.w3.org/TR/html5/syntax.html#void-elements
 * @see https://www.w3.org/TR/html5/syntax.html#normal-elements
 *
 * If it is a Normal Element, Parchment will not manipulate
 * or generally be aware of the element's children.
 * It will be important to correctly implement the blot's index()
 * and position() functions to correctly work with cursors/selections.
 */
class EmbedBlot extends LeafBlot implements Formattable {

  /**
   * This implementation does not match any DOM Node.
   */
  static formats(domNode: HTMLElement): any {
    return undefined;
  }

  /**
   * Calls super.formatAt for the whole Blot.
   *
   * super.formatAt wraps, which is what we want in general,
   * but this allows subclasses to overwrite for formats
   * that just apply to particular embeds.
   *
   * @param name - The name of a registered Blot or Attributor.
   * @param value - The value to instantiate the Blot or Attributor with.
   */
  format(name: string, value: any): void {
    super.formatAt(0, this.length(), name, value);
  }

  /**
   * @inheritDoc
   */
  formatAt(index: number, length: number, name: string, value: any): void {
    if (index === 0 && length === this.length()) {
      this.format(name, value);
    } else {
      super.formatAt(index, length, name, value);
    }
  }

  /**
   * @inheritDoc
   */
  formats(): { [index: string]: any } {
    return this.statics.formats(this.domNode);
  }
}

export default EmbedBlot;
