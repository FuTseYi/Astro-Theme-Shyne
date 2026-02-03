import { h } from 'hastscript'

/**
 * Capitalizes the first letter of a string
 */
const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1)

/**
 * Creates an admonition/callout component
 * Supports types: note, tip, important, warning, caution
 * 
 * @param {Object} properties - The properties of the component
 * @param {string} [properties.title] - An optional custom title
 * @param {Array} children - The children elements
 * @param {string} type - The admonition type
 * @returns {Object} The created admonition component
 */
export function AdmonitionComponent(properties, children, type) {
  if (!Array.isArray(children) || children.length === 0) {
    return h(
      'div',
      { class: 'hidden' },
      'Invalid admonition directive. Use: :::note <content> :::'
    )
  }

  let label = null
  let titleText = capitalize(type)
  
  // Check if there's a custom title/label
  if (properties?.['has-directive-label']) {
    label = children[0] // The first child is the custom label
    children = children.slice(1) // Remove the label from children
    
    // Extract text from label for the title
    if (label && label.children && label.children.length > 0) {
      const labelText = label.children
        .map(child => child.value || '')
        .join('')
        .trim()
      
      if (labelText) {
        titleText = `${capitalize(type)} (${labelText})`
      }
    }
  }

  return h('blockquote', { class: `admonition bdm-${type}` }, [
    h('div', { class: 'bdm-title' }, titleText),
    ...children,
  ])
}
