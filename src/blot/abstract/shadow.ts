import { Blot, Parent, Formattable } from './blot';
import * as Registry from '../../registry';

/**
 * The base implementation of a Blot.
 */
class ShadowBlot implements Blot {

  /** A name to register the blot under. 2 registered blot's cannot share the same blotName. */
  static blotName = 'abstract';

  /** A className to assosciate with the Blot. */
  static className: string;

  /** Scope is a method of categorizing Blots. */
  static scope: Registry.Scope;

  /**
   * The name of the tag for the Blot's DOM Node.
   * If a Blot shares a tagName with another Blot, it must implement className as well.
   */
  static tagName: string;

  /** @inheritDoc */
  prev!: Blot;

  /** @inheritDoc */
  next!: Blot;

  /** @inheritDoc */
  parent!: Parent;

  /** @inheritDoc */
  scroll!: Parent;

  /**
   * Hack for accessing inherited static methods.
   */
  get statics(): any {
    return this.constructor;
  }

  /**
   * Create an instance of the blot. Use this instead of the constructor.
   *
   * @param value - The value to initialize the Blot with.
   */
  static create(value: any): Node {
    if (this.tagName == null) {
      throw new Registry.ParchmentError('Blot definition missing tagName');
    }
    let node;
    if (Array.isArray(this.tagName)) {
      if (typeof value === 'string') {
        value = value.toUpperCase();
        if (parseInt(value).toString() === value) {
          value = parseInt(value);
        }
      }
      if (typeof value === 'number') {
        node = document.createElement(this.tagName[value - 1]);
      } else if (this.tagName.indexOf(value) > -1) {
        node = document.createElement(value);
      } else {
        node = document.createElement(this.tagName[0]);
      }
    } else {
      node = document.createElement(this.tagName);
    }
    if (this.className) {
      node.classList.add(this.className);
    }
    return node;
  }

  /**
   * You should never instantiate a Blot with new ().
   * Always use the static create() function.
   *
   * @param domNode - The DOM Node to link the Blot to.
   */
  constructor(public domNode: Node) {
    // @ts-ignore
    this.domNode[Registry.DATA_KEY] = { blot: this };
  }

  /**
   * @inheritDoc
   */
  attach(): void {
    if (this.parent != null) {
      this.scroll = this.parent.scroll;
    }
  }

  /**
   * @inheritDoc
   */
  clone(): Blot {
    let domNode = this.domNode.cloneNode(false);
    return Registry.create(domNode);
  }

  /**
   * @inheritDoc
   */
  detach() {
    if (this.parent != null) this.parent.removeChild(this);
    // @ts-ignore
    delete this.domNode[Registry.DATA_KEY];
  }

  /**
   * @inheritDoc
   */
  deleteAt(index: number, length: number): void {
    let blot = this.isolate(index, length);
    blot.remove();
  }

  /**
   * @inheritDoc
   */
  formatAt(index: number, length: number, name: string, value: any): void {
    let blot = this.isolate(index, length);
    if (Registry.query(name, Registry.Scope.BLOT) != null && value) {
      blot.wrap(name, value);
    } else if (Registry.query(name, Registry.Scope.ATTRIBUTE) != null) {
      let parent = <Parent & Formattable>Registry.create(this.statics.scope);
      blot.wrap(parent);
      parent.format(name, value);
    }
  }

  /**
   * Instantiate a Blot and insert it inside of this one.
   *
   * @param index - The index to insert the Blot before.
   * @param value - The name of a registered Blot, or a the value of a Text Blot.
   * @param def - The value of a registered Blot. If set to null, the value param will set as the value of a TextBlot.
   */
  insertAt(index: number, name: string, value?: any): void {
    let blot = value == null ? Registry.create('text', name) : Registry.create(name, value);
    let ref = this.split(index);
    this.parent.insertBefore(blot, ref);
  }

  /**
   * @inheritDoc
   */
  insertInto(parentBlot: Parent, refBlot: Blot | null = null): void {
    if (this.parent != null) {
      this.parent.children.remove(this);
    }
    let refDomNode: Node | null = null;
    parentBlot.children.insertBefore(this, refBlot);
    if (refBlot != null) {
      refDomNode = refBlot.domNode;
    }
    if (this.next == null || this.domNode.nextSibling != refDomNode) {
      parentBlot.domNode.insertBefore(this.domNode, refDomNode);
    }
    this.parent = parentBlot;
    this.attach();
  }

  /**
   * @inheritDoc
   */
  isolate(index: number, length: number): Blot {
    let target = this.split(index);
    target.split(length);
    return target;
  }

  /**
   * The length of the Blot.
   */
  length(): number {
    return 1;
  }

  /**
   * @inheritDoc
   */
  offset(root: Blot = this.parent): number {
    if (this.parent == null || this == root) return 0;
    return this.parent.children.offset(this) + this.parent.offset(root);
  }

  /**
   * @inheritDoc
   */
  optimize(context: { [key: string]: any }): void {
    // TODO clean up once we use WeakMap
    // @ts-ignore
    if (this.domNode[Registry.DATA_KEY] != null) {
      // @ts-ignore
      delete this.domNode[Registry.DATA_KEY].mutations;
    }
  }

  /**
   * @inheritDoc
   */
  remove(): void {
    if (this.domNode.parentNode != null) {
      this.domNode.parentNode.removeChild(this.domNode);
    }
    this.detach();
  }

  /**
   * @inheritDoc
   */
  replace(target: Blot): void {
    if (target.parent == null) return;
    target.parent.insertBefore(this, target.next);
    target.remove();
  }

  /**
   * @inheritDoc
   */
  replaceWith(name: string | Blot, value?: any): Blot {
    let replacement = typeof name === 'string' ? Registry.create(name, value) : name;
    replacement.replace(this);
    return replacement;
  }

  /**
   * @inheritDoc
   */
  split(index: number, force?: boolean): Blot {
    return index === 0 ? this : this.next;
  }

  /**
   * @inheritDoc
   */
  update(mutations: MutationRecord[], context: { [key: string]: any }): void {
    // Nothing to do by default
  }

  /**
   * @inheritDoc
   */
  wrap(name: string | Parent, value?: any): Parent {
    let wrapper = typeof name === 'string' ? <Parent>Registry.create(name, value) : name;
    if (this.parent != null) {
      this.parent.insertBefore(wrapper, this.next);
    }
    wrapper.appendChild(this);
    return wrapper;
  }
}

export default ShadowBlot;
