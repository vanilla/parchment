import { Blot, Leaf } from './abstract/blot';
import LeafBlot from './abstract/leaf';
import * as Registry from '../registry';

/**
 * Blot that contains text content.
 */
class TextBlot extends LeafBlot implements Leaf {

  /** @inheritDoc */
  static blotName = 'text';

  /** @inheritDoc */
  static scope = Registry.Scope.INLINE_BLOT;

  /** @inheritDoc */
  public domNode!: Text;

  /** The text content of the Blot. */
  protected text: string;

  /**
   * @inheritDoc
   */
  static create(value: string): Text {
    return document.createTextNode(value);
  }

  /**
   * Get the value represented by DOM Node if it is this Blot's type.
   *
   * This function does not check that the DOM Node is actually of the current type
   * so using this function will require doing that validation externally.
   *
   * @param domNode - the DOM Node to check.
   *
   * @returns The text content of the DOM Node.
   */
  static value(domNode: Text): string {
    let text = domNode.data;
    // @ts-ignore
    if (text['normalize']) text = text['normalize']();
    return text;
  }

  /**
   * @inheritDoc
   */
  constructor(node: Node) {
    super(node);
    this.text = this.statics.value(this.domNode);
  }

  /**
   * Delete the text in the given range.
   *
   * @param index - The start of the range.
   * @param length - The length of the range.
   */
  deleteAt(index: number, length: number): void {
    this.domNode.data = this.text = this.text.slice(0, index) + this.text.slice(index + length);
  }

  /**
   * @inheritDoc
   */
  index(node: Node, offset: number): number {
    if (this.domNode === node) {
      return offset;
    }
    return -1;
  }

  /**
   * Insert the text at the given index.
   *
   * @param index - The insertion point.
   * @param value - The text to insert.
   */
  insertAt(index: number, value: string, def?: any): void {
    if (def == null) {
      this.text = this.text.slice(0, index) + value + this.text.slice(index);
      this.domNode.data = this.text;
    } else {
      super.insertAt(index, value, def);
    }
  }

  /**
   * @inheritDoc
   */
  length(): number {
    return this.text.length;
  }


  /**
   * Reduce the complexity of the DOM tree.
   *
   * - Deletes itself if its length is 0.
   * - Merges the next TextBlot into itself if possible.
   */
  optimize(context: { [key: string]: any }): void {
    super.optimize(context);
    this.text = this.statics.value(this.domNode);
    if (this.text.length === 0) {
      this.remove();
    } else if (this.next instanceof TextBlot && this.next.prev === this) {
      this.insertAt(this.length(), (<TextBlot>this.next).value());
      this.next.remove();
    }
  }

  /**
   * @inheritDoc
   */
  position(index: number, inclusive: boolean = false): [Node, number] {
    return [this.domNode, index];
  }

  /**
   * Split the current TextBlot into 2 TextBlots at the given index.
   *
   * @param index - The index to split at.
   * @param force - If force is set, this Blot will split itself into 2 container Blots, even if the index passed is at the start of or end of this Blot.
   *
   * @returns The split blot.
   */
  split(index: number, force: boolean = false): Blot {
    if (!force) {
      if (index === 0) return this;
      if (index === this.length()) return this.next;
    }
    let after = Registry.create(this.domNode.splitText(index));
    this.parent.insertBefore(after, this.next);
    this.text = this.statics.value(this.domNode);
    return after;
  }

  /**
   * @inheritDoc
   */
  update(mutations: MutationRecord[], context: { [key: string]: any }): void {
    if (
      mutations.some(mutation => {
        return mutation.type === 'characterData' && mutation.target === this.domNode;
      })
    ) {
      this.text = this.statics.value(this.domNode);
    }
  }

  /**
   * Get the value represented by this Blot's DOM Node if it is this Blot's type.
   *
   * @returns The text content of the DOM Node.
   */
  value(): string {
    return this.text;
  }
}

export default TextBlot;
