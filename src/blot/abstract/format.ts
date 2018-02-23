import Attributor from '../../attributor/attributor';
import AttributorStore from '../../attributor/store';
import { Blot, Parent, Formattable } from './blot';
import ContainerBlot from './container';
import ShadowBlot from './shadow';
import * as Registry from '../../registry';

/**
 * A container blot that can hold and manage attributors.
 *
 * @see {Attributor}
*/
class FormatBlot extends ContainerBlot implements Formattable {

  /** The attributes for the blot. */
  protected attributes: AttributorStore;

  /**
   * Check if this Blot is a format for a given DOM Node
   *
   * @param domNode - The DOMNode to check.
   *
   * @returns {string|boolean|undefined} A string if there are mutliple potential tagNames, or a boolean the tagName is defined as a single string.
   */
  static formats(domNode: HTMLElement): any {
    if (typeof this.tagName === 'string') {
      return true;
    } else if (Array.isArray(this.tagName)) {
      return domNode.tagName.toLowerCase();
    }
    return undefined;
  }

  /**
   * @param domNode - The DOM Node to create the format from.
   */
  constructor(domNode: Node) {
    super(domNode);
    this.attributes = new AttributorStore(this.domNode);
  }

  /**
   * Set a format on the current Blot.
   *
   * Either set an attributor or replace this Blot with an instance of the new Blot.
   *
   * @param name - The name of a registered Attributor or Blot.
   * @param value - The value to set the Attributor with or create the new Blot with.
   */
  format(name: string, value: any): void {
    let format = Registry.query(name);
    if (format instanceof Attributor) {
      this.attributes.attribute(format, value);
    } else if (value) {
      if (format != null && (name !== this.statics.blotName || this.formats()[name] !== value)) {
        this.replaceWith(name, value);
      }
    }
  }

  /**
   * Get all of the formats from this Blot and it's Attributors.
   */
  formats(): { [index: string]: any } {
    let formats = this.attributes.values();
    let format = this.statics.formats(this.domNode);
    if (format != null) {
      formats[this.statics.blotName] = format;
    }
    return formats;
  }

  /**
   * @inheritDoc
   */
  replaceWith(name: string | Blot, value?: any): Blot {
    let replacement = <FormatBlot>super.replaceWith(name, value);
    this.attributes.copy(replacement);
    return replacement;
  }

  /**
   * @inheritDoc
   */
  update(mutations: MutationRecord[], context: { [key: string]: any }): void {
    super.update(mutations, context);
    if (
      mutations.some(mutation => {
        return mutation.target === this.domNode && mutation.type === 'attributes';
      })
    ) {
      this.attributes.build();
    }
  }

  /**
   * @inheritDoc
   */
  wrap(name: string | Parent, value?: any): Parent {
    let wrapper = super.wrap(name, value);
    if (wrapper instanceof FormatBlot && wrapper.statics.scope === this.statics.scope) {
      this.attributes.move(wrapper);
    }
    return wrapper;
  }
}

export default FormatBlot;
