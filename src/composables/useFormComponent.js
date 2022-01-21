import _ from 'lodash'
import { computed, getCurrentInstance } from 'composition-api'
import useForm$ from './useForm$'
import useTheme from './useTheme'
import use$Size from './use$Size'
import use$View from './use$View'
import MergeFormClasses from './../utils/mergeFormClasses'

const base = function(props, context, dependencies, options = {})
{
  const componentName = context.name

  // =============== INJECT ===============

  const {
    form$
  } = useForm$(props, context)

  const {
    theme
  } = useTheme(props, context)

  const {
    Size
  } = use$Size(props, context)

  const {
    View
  } = use$View(props, context)
  
  // ============== COMPUTED ===============

  /**
   * The component instance (self).
   * 
   * @type {component}
   */
  const component$ = computed(() => {
    return getCurrentInstance().proxy
  })

  /**
   * An object containaing all the component's classes in key/value pairs. Class values are merged based on the default classes provided by the theme respecing any additional classes / overrides.
   * 
   * @type {object}
   * @private
   */
  const mergedClasses = computed(() => {
    return (new MergeFormClasses({
      component: componentName.value,
      component$: component$,
      theme: theme.value,
      config: form$.value.$vueform.config,
      templates: templates.value,
      view: View.value,
      merge: [
        form$.value,
      ],
    })).classes
  })

  /**
   The selected theme's classes merged with the form's [`addClasses`](vueform#option-add-classes) and [`overrideClasses`](vueform#option-override-classes) options.
   * 
   * @type {object}
   */
  const classes = computed({
    get() {
      return mergedClasses.value
    },
    set(val) {
      schema.value.classes = val
    }
  })

  /**
   * Returns the component templates used by the form.
   * 
   * @type {object}
   */
  const templates = computed(() => {
    return theme.value.templates
  })

  /**
   * The component's template.
   * 
   * @type {object}
   */
  const template = computed(() => {
    return View.value && templates.value[`${componentName.value}_${View.value}`]
            ? templates.value[`${componentName.value}_${View.value}`]
            : templates.value[componentName.value]
  })

  return {
    form$,
    theme,
    Size,
    View,
    classes,
    templates,
    template,
  }
}

export default base