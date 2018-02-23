import { Blot, Parent, Leaf } from './blot';
import LinkedList from '../../collection/linked-list';
import ShadowBlot from './shadow';
import * as Registry from '../../registry';

class ContainerBlot extends ShadowBlot implements Parent {

  /** The blotName of the Blot to instantiate if this Blot is empty. */
  static defaultChild: string;

  /**
   * An array of Blot constructors.
   * If a Blot that is not an instance of one of these constructors is set as a direct child,
   * a ParchmentError will be thrown.
   */
  static allowedChildren: any[];

  /** An LinkedList of children blots. */
  children!: LinkedList<Blot>;

  /** @inheritDoc */
  domNode!: HTMLElement;

  constructor(domNode: Node) {
    super(domNode);
    this.build();
  }

  /**
   * @inheritDoc
   */
  appendChild(other: Blot): void {
    this.insertBefore(other);
  }

  /**
   *  Attach the scroll to the current blot. The scroll is grabbed through the parent.
   *
   * Also attach all of its children.
   */
  attach(): void {
    super.attach();
    this.children.forEach(child => {
      child.attach();
    });
  }

  /**
   * Create the children of the this Blot form this Blot's DOM Node's children.
   */
  build(): void {
    this.children = new LinkedList<Blot>();

    // Need to be reversed for if DOM nodes already in order
    [].slice
      .call(this.domNode.childNodes)
      .reverse()
      .forEach((node: Node) => {
        try {
          let child = makeBlot(node);
          this.insertBefore(child, this.children.head || undefined);
        } catch (err) {
          if (err instanceof Registry.ParchmentError) return;
          else throw err;
        }
      });
  }

  /**
   * Remove the Blot in the given range.
   *
   * If this Blot has children, deleteAt will be called on all child Blots in range.
   *
   * @param index - The start of the range.
   * @param length - The length of the range.
   */
  deleteAt(index: number, length: number): void {
    if (index === 0 && length === this.length()) {
      return this.remove();
    }
    this.children.forEachAt(index, length, function(child, offset, length) {
      child.deleteAt(offset, length);
    });
  }

  /**
   * Find the first descendant Blot that matches the given criteria.
   *
   * If another Container Blot is found at passed index, it will check recursively for descendants until it finds a non-Container Blot.
   *
   * @param criteria - A Blot constructor. The child Blot returned must be an isntance of this Blot.
   * @param index - The index to search at.
   *
   * @returns A tuple containg:
   * - A child Blot if found.
   * - The offset of the child within the children LinkedList.
   */
  descendant(criteria: { new (): Blot }, index: number): [Blot | null, number];

  /**
   * Find the first descendant Blot that matches the given criteria.
   *
   * If another Container Blot is found at passed index, it will check recursively for descendants until it finds a non-Container Blot.
   *
   * @param criteria - A matching function. This takes a potential child Blot instance and returns whether or not it matches.
   * @param index - The index to search at.
   *
   * @returns A tuple containg:
   * - A child Blot if found.
   * - The offset of the child within the children LinkedList.
   */
  descendant(criteria: (blot: Blot) => boolean, index: number): [Blot | null, number];

  /**
   * Find the first descendant Blot that matches the given criteria.
   *
   * If another Container Blot is found at passed index, it will check recursively for descendants until it finds a non-Container Blot.
   *
   * @param criteria - A matching function. This takes a potential child Blot instance and returns whether or not it matches.
   *
   * @returns A tuple containg:
   * - A child Blot if found.
   * - The offset of the child within the children LinkedList.
   */
  descendant(criteria: any, index: number): [Blot | null, number] {
    let [child, offset] = this.children.find(index);
    if (
      (criteria.blotName == null && criteria(child)) ||
      (criteria.blotName != null && child instanceof criteria)
    ) {
      return [<any>child, offset];
    } else if (child instanceof ContainerBlot) {
      return child.descendant(criteria, offset);
    } else {
      return [null, -1];
    }
  }

  /**
   * Find all descendant Blots that matches the given criteria inside the given range.
   *
   * If another Container Blot is found inside the range, it will check recursively check its descendants for all for Blots that match the passed criteria.
   *
   * @param criteria - A Blot constructor. The child Blots returned must be instances of this Blot.
   * @param index - The start of the range to search at.
   * @param length - The length of the range to search at.
   *
   * @returns An array of Blots matching the criteria.
   */
  descendants(criteria: { new (): Blot }, index: number, length: number): Blot[];

  /**
   * Find all descendant Blots that matches the given criteria inside the given range.
   *
   * If another Container Blot is found inside the range, it will check recursively check its descendants for all for Blots that match the passed criteria.
   *
   * @param criteria - A matching function. This takes a potential child Blot instance and returns whether or not it matches.
   * @param index - The start of the range to search at.
   * @param length - The length of the range to search at.
   *
   * @returns An array of Blots matching the criteria.
   */
  descendants(criteria: (blot: Blot) => boolean, index: number, length: number): Blot[];

  /**
   * Find all descendant Blots that matches the given criteria inside the given range.
   *
   * If another Container Blot is found inside the range, it will check recursively check its descendants for all for Blots that match the passed criteria.
   *
   * @param criteria - A matching function. This takes a potential child Blot instance and returns whether or not it matches.
   * @param index - The start of the range to search at.
   * @param length - The length of the range to search at.
   *
   * @returns An array of Blots matching the criteria.
   */
  descendants(criteria: any, index: number = 0, length: number = Number.MAX_VALUE): Blot[] {
    let descendants: Blot[] = [];
    let lengthLeft = length;
    this.children.forEachAt(index, length, function(child: Blot, index: number, length: number) {
      if (
        (criteria.blotName == null && criteria(child)) ||
        (criteria.blotName != null && child instanceof criteria)
      ) {
        descendants.push(child);
      }
      if (child instanceof ContainerBlot) {
        descendants = descendants.concat(child.descendants(criteria, index, lengthLeft));
      }
      lengthLeft -= length;
    });
    return descendants;
  }

  /**
   * Remove this blot from its parent and its DOM Node.
   *
   * Additionally detach() is called on all child Blots.
   */
  detach(): void {
    this.children.forEach(function(child) {
      child.detach();
    });
    super.detach();
  }

  /**
   * @inheritDoc
   */
  formatAt(index: number, length: number, name: string, value: any): void {
    this.children.forEachAt(index, length, function(child, offset, length) {
      child.formatAt(offset, length, name, value);
    });
  }

  /**
   * @inheritDoc
   */
  insertAt(index: number, value: string, def?: any): void {
    let [child, offset] = this.children.find(index);
    if (child) {
      child.insertAt(offset, value, def);
    } else {
      let blot = def == null ? Registry.create('text', value) : Registry.create(value, def);
      this.appendChild(blot);
    }
  }


  /**
   * Add a child Blot as a child of this Blot. Position the childBlot by passing an instance of another Blot that you want the childBlot to be directly before.
   *
   * @param childBlot - The Blot to insert.
   * @param refBlot - The Blot to insert the childBlot before.
   *
   * @throws {Registry.ParchmentError} - If the childBlot is not in this Blot's allowedChildren
   */
  insertBefore(childBlot: Blot, refBlot?: Blot): void {
    if (
      this.statics.allowedChildren != null &&
      !this.statics.allowedChildren.some(function(child: Registry.BlotConstructor) {
        return childBlot instanceof child;
      })
    ) {
      throw new Registry.ParchmentError(
        `Cannot insert ${(<ShadowBlot>childBlot).statics.blotName} into ${this.statics.blotName}`,
      );
    }
    childBlot.insertInto(this, refBlot);
  }

  /**
   * The length of all child Blots together.
   */
  length(): number {
    return this.children.reduce(function(memo, child) {
      return memo + child.length();
    }, 0);
  }

  /**
   * Move the children from
   *
   * @param targetParent
   * @param refNode
   */
  moveChildren(targetParent: Parent, refNode?: Blot): void {
    this.children.forEach(function(child) {
      targetParent.insertBefore(child, refNode);
    });
  }

  /**
   * If a defaultChild is set, create an isntance of it, and append it to this Blot. Otherwise remove this Blot.
   *
   * Because optimize is not allowed to change the length or value of the document, the default child must have a length of 0 in it's default state.
   *
   * @param mutations - The mutations prompting the optimization pass. @see https://developer.mozilla.org/en-US/docs/Web/API/MutationRecord
   * @param context - A shared context that is passed through all updated Blots.
   */
  optimize(context: { [key: string]: any }) {
    super.optimize(context);
    if (this.children.length === 0) {
      if (this.statics.defaultChild != null) {
        let child = Registry.create(this.statics.defaultChild);
        this.appendChild(child);
        child.optimize(context);
      } else {
        this.remove();
      }
    }
  }

  /**
   * Get all of the Blots and their indexed from the start of this Blot to the given index.
   *
   * @param index - The index to find until.
   * @param incusive - Whether or not to include a Blot that ends on the index.
   *
   * @returns An array of tuples made up of:
   * - A Blot instance
   * - The position of the Blot in it's LinkedList.
   */
  path(index: number, inclusive: boolean = false): [Blot, number][] {
    let [child, offset] = this.children.find(index, inclusive);
    let position: [Blot, number][] = [[this, index]];
    if (child instanceof ContainerBlot) {
      return position.concat(child.path(offset, inclusive));
    } else if (child != null) {
      position.push([child, offset]);
    }
    return position;
  }

  /**
   * Remove a Blot instance from this Blot's list of children. This function should generally only be called form the child Blot's remove() function.
   *
   * @param {Blot} child - The blot to remove.
   */
  removeChild(child: Blot): void {
    this.children.remove(child);
  }

  /**
   * Replace the target Blot with this Blot.
   *
   * If the target Blot is another Container, the children will be moved over as well.
   *
   * @param target - The Blot to replace.
   */
  replace(target: Blot): void {
    if (target instanceof ContainerBlot) {
      target.moveChildren(this);
    }
    super.replace(target);
  }

  /**
   * Split the current Container into 2 containers at the given index.
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
    let after = <ContainerBlot>this.clone();
    this.parent.insertBefore(after, this.next);
    this.children.forEachAt(index, this.length(), function(child, offset, length) {
      child = child.split(offset, force);
      after.appendChild(child);
    });
    return after;
  }

  /**
   * Move this Blot's children to it's parent, and remove this Blot.
   */
  unwrap(): void {
    this.moveChildren(this.parent, this.next);
    this.remove();
  }

  /**
   * @inheritDoc
   */
  update(mutations: MutationRecord[], context: { [key: string]: any }): void {
    let addedNodes: Node[] = [];
    let removedNodes: Node[] = [];
    mutations.forEach(mutation => {
      if (mutation.target === this.domNode && mutation.type === 'childList') {
        addedNodes.push.apply(addedNodes, mutation.addedNodes);
        removedNodes.push.apply(removedNodes, mutation.removedNodes);
      }
    });
    removedNodes.forEach((node: Node) => {
      // Check node has actually been removed
      // One exception is Chrome does not immediately remove IFRAMEs
      // from DOM but MutationRecord is correct in its reported removal
      if (
        node.parentNode != null &&
        // @ts-ignore
        node.tagName !== 'IFRAME' &&
        document.body.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_CONTAINED_BY
      ) {
        return;
      }
      let blot = Registry.find(node);
      if (blot == null) return;
      if (blot.domNode.parentNode == null || blot.domNode.parentNode === this.domNode) {
        blot.detach();
      }
    });
    addedNodes
      .filter(node => {
        return node.parentNode == this.domNode;
      })
      .sort(function(a, b) {
        if (a === b) return 0;
        if (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) {
          return 1;
        }
        return -1;
      })
      .forEach(node => {
        let refBlot: Blot | null = null;
        if (node.nextSibling != null) {
          refBlot = Registry.find(node.nextSibling);
        }
        let blot = makeBlot(node);
        if (blot.next != refBlot || blot.next == null) {
          if (blot.parent != null) {
            blot.parent.removeChild(this);
          }
          this.insertBefore(blot, refBlot || undefined);
        }
      });
  }
}

/**
 * Utility function to make a blot from a DOM Node.
 *
 * If passed DOM Node doesn't match any registered Blots, then this function will fallback to an Inline Blot.
 *
 * @param {Node} node - The DOM Node to generate a Blot from.
 *
 * @returns {Blot} - The generated Blot.
 */
function makeBlot(node: Node): Blot {
  let blot = Registry.find(node);
  if (blot == null) {
    try {
      blot = Registry.create(node);
    } catch (e) {
      blot = Registry.create(Registry.Scope.INLINE);
      [].slice.call(node.childNodes).forEach(function(child: Node) {
        // @ts-ignore
        blot.domNode.appendChild(child);
      });
      if (node.parentNode) {
        node.parentNode.replaceChild(blot.domNode, node);
      }
      blot.attach();
    }
  }
  return blot;
}

export default ContainerBlot;
