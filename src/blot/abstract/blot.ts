import LinkedList from '../../collection/linked-list';
import LinkedNode from '../../collection/linked-node';
import Attributor from '../../attributor/attributor';

export interface Blot extends LinkedNode {

  /** The nearest scroll blot. */
  scroll: Parent;

  /** The parent blot. */
  parent: Parent;

  /** The previous blot. */
  prev: Blot;

  /** The next blot. */
  next: Blot;

  /** The DOM Node the blot get's attached to. */
  domNode: Node;

  /**
   * Attach the scroll to the current blot. The scroll is grabbed through the parent.
   */
  attach(): void;

  /**
   * Clone this blot's DOM Node into a new Blot.
   *
   * @returns The cloned Blot.
   */
  clone(): Blot;

  /**
   * Remove this blot from its parent and its DOM Node.
   */
  detach(): void;

  /**
   * Remove this Blot from it's current parent and link it to a new parent.
   *
   * @param parentBlot - An instance of a Parent Blot.
   * @param refBlot - A Blot to insert this Blot before in the new Parent Blot.
   */
  insertInto(parentBlot: Parent, refBlot?: Blot): void;

  /**
   * Retreive the Blot within the passed Range.
   *
   * @param index - The start of the range to check.
   * @param length - The length of the range to check.
   */
  isolate(index: number, length: number): Blot;

  /**
   * Get the distance between the given Blot and this Blot.
   *
   * @param root - The Blot to start with. Defaults to the parent Blot.
   */
  offset(root?: Blot): number;

  /**
   * Remove this DOM Node from its parent DOM Node. Then detach this Blot from its DOM Node.
   *
   * After this function is called, Parchment should hold no references to this Blot's DOM Node.
   */
  remove(): void;

  /**
   * Replace the target Blot with this Blot.
   *
   * @param target - The Blot to replace.
   */
  replace(target: Blot): void;

  /**
   * Replace this Blot with another Blot.
   *
   * @param name - The blotName of a registered Blot.
   * @param value - The value to instantiate the blotName with.
   *
   * @returns The replacement Blot instance.
   */
  replaceWith(name: string, value: any): Blot;

  /**
   * Replace this Blot with another Blot.
   *
   * @param replacement - An instance of a Blot.
   *
   * @returns The replacement Blot instance.
   */
  replaceWith(replacement: Blot): Blot;

  /**
   * Get the Blot at the given index.
   *
   * @param index - The index to check.
   * @param force - Unused in this implementation.
   *
   * @returns Either the current Blot or the next Blot based on the index.
   */
  split(index: number, force?: boolean): Blot;

  /**
   * Wrap this blot with a Parent blot. The Parent will be attached in place of the current Blot.
   *
   * @param name - The blotName of another registered Blot.
   * @param value - The value to instantiate the blotName with.
   *
   * @returns The replacement Parent instance.
   */
  wrap(name: string, value: any): Parent;

  /**
   * Wrap this blot with a Parent blot. The Parent will be attached in place of the current Blot.
   *
   * @param parent - An instance of a Blot.
   *
   * @returns The replacement Parent instance.
   */
  wrap(wrapper: Parent): Parent;

  /**
   * Remove the Blot in the given range.
   *
   * @param index - The start of the range.
   * @param length - The length of the range.
   */
  deleteAt(index: number, length: number): void;

  /**
   * Wraps a blot with the passed Attributor or Blot.
   *
   * If an attributor is passed another Blot of this Blot's scope will wrap it,
   * and that new parent will be formatted with an instance of the passed Attributor.
   *
   * @param index - The start of the range.
   * @param length - The length of the range.
   * @param name - A blot or attributor name.
   * @param value - The value for the new blot ro attributor.
   */
  formatAt(index: number, length: number, name: string, value: any): void;

  insertAt(index: number, value: string, def?: any): void;

  /**
   * Reduce the complexity of the DOM tree. Cannot change the value or length of the document.
   *
   * Called after completion of the update cycle.
   *
   * @param context - A shared context that is passed between all blots.
   */
  optimize(context: { [key: string]: any }): void;

  /**
   * Reduce the complexity of the DOM tree. Cannot change the value or length of the document.
   *
   * Called after completion of the update cycle.
   *
   * @param mutations - The mutations prompting the optimization pass. @see https://developer.mozilla.org/en-US/docs/Web/API/MutationRecord
   * @param context - A shared context that is passed through all updated Blots.
   */
  optimize(mutations: MutationRecord[], context: { [key: string]: any }): void;

  /**
   * Handle mutations from this Blot's DOM Node.
   *
   * Internal records of the blot values can be updated, and modifcations of
   * the blot itself is permitted. Can be triggered from user change or API call.
   *
   * @param mutations - The mutations to check. @see https://developer.mozilla.org/en-US/docs/Web/API/MutationRecord
   * @param context - A shared context that is passed through all updated Blots.
   */
  update(mutations: MutationRecord[], context: { [key: string]: any }): void;
}

export interface Parent extends Blot {
  children: LinkedList<Blot>;
  domNode: HTMLElement;

  appendChild(child: Blot): void;
  descendant<T>(type: { new (): T }, index: number): [T, number];
  descendant<T>(matcher: (blot: Blot) => boolean, index: number): [T, number];
  descendants<T>(type: { new (): T }, index: number, length: number): T[];
  descendants<T>(matcher: (blot: Blot) => boolean, index: number, length: number): T[];
  insertBefore(child: Blot, refNode?: Blot): void;
  moveChildren(parent: Parent, refNode?: Blot): void;
  path(index: number, inclusive?: boolean): [Blot, number][];
  removeChild(child: Blot): void;
  unwrap(): void;
}

export interface Formattable extends Blot {
  format(name: string, value: any): void;
  formats(): { [index: string]: any };
}

export interface Leaf extends Blot {
  index(node: Node, offset: number): number;
  position(index: number, inclusive: boolean): [Node, number];
  value(): any;
}
