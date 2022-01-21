import _ from 'lodash'
// @todo: check required schema (eg. `elements` property) here and everywhere
import { computed, ref, toRefs, watch, onMounted, onBeforeMount, onBeforeUnmount, nextTick, getCurrentInstance, markRaw } from 'composition-api'
import useFormComponent from './../composables/useFormComponent'
import useConditions from './../composables/useConditions'
import useLabel from './../composables/useLabel'
import useEvents from './../composables/useEvents'
import normalize from './../utils/normalize'

export default {
  name: 'FormTab',
  emits: ['activate', 'inactivate'],
  slots: ['default'],
  props: {
    /**
     * Name of tab within [tabs](reference/frontend-form#prop-tabs) object.
     */
    name: {
      type: [String, Number],
      required: true,
    },

    label: {
      type: [String, Object, Function],
      required: false,
      default: null
    },

    elements: {
      type: [Array],
      required: false,
      default: () => ([])
    },

    conditions: {
      type: [Array],
      required: false,
      default: () => ([])
    },
    
    addClass: {
      required: false,
      type: [Array, Object, String],
      default: null,
    },
    removeClass: {
      required: false,
      type: [Array, Object],
      default: null,
    },
    replaceClass: {
      required: false,
      type: [Object],
      default: null
    },
    overrideClass: {
      required: false,
      type: [Array, Object, String],
      default: null
    },
    view: {
      required: false,
      type: [String],
      default: undefined,
    },

    onActivate: {
      type: [Function],
      required: false,
      default: null,
      private: true,
    },

    onInactivate: {
      type: [Function],
      required: false,
      default: null,
      private: true,
    },
  },
  setup(props, context)
  {  
    const { 
      name,
      label,
      elements,
      conditions,
      addClass,
    } = toRefs(props)

    const $this = getCurrentInstance().proxy

    // ============ DEPENDENCIES ============

    const {
      form$,
      Size,
      View,
      theme,
      classes,
      templates,
      template,
    } = useFormComponent(props, context)

    const {
      available,
    } = useConditions(props, context, { form$ })

    const {
      isLabelComponent,
      label: tabLabel_,
    } = useLabel(props, context, { component$: form$, labelDefinition: label })

    const {
      events,
      listeners,
      on,
      off,
      fire
    } = useEvents(props, context, { form$ }, {
      events: context.emits,
    })

    // ================ DATA ================

    /**
     * Whether the tab is active.
     * 
     * @type {boolean}
     * @default false
     */
    const active = ref(false)

    /**
     * The label of the tab.
     * 
     * @type {string|component}
     * @default null
     */
    const tabLabel = ref(tabLabel_.value && typeof tabLabel_.value === 'object' ? markRaw(tabLabel_.value) : tabLabel_.value)

    // ============== COMPUTED ==============

    /**
     * The components of highest level form elements.
     * 
     * @type {object}
     */
    const elements$ = computed(() => {
      return form$.value.elements$
    })

    /**
     * The parent [`FormTabs`](form-tabs) component.
     * 
     * @type {component}
     */
    const tabs$ = computed(() => {
      return form$.value.tabs$
    })

    /**
     * Index of this tab among the other tabs which are not hidden by unmet conditions.
     * 
     * @type {number}
     */
    const index = computed(() => {
      return Object.keys(tabs$.value.tabs$).indexOf(name.value)
    })

    /**
     * The components of form elements within the tab.
     * 
     * @type {object}
     */
    const children$ = computed(() => {
      return _.filter(elements$.value, (element$, key) => {
        return elements.value.indexOf(key) !== -1
      })
    })

    /**
     * Whether the tab should be visible.
     * 
     * @type {boolean}
     */
    const visible = computed(() => {
      return available.value
    })

    /**
     * Whether the tab has any invalid elements.
     * 
     * @type {boolean}
     */
    const invalid = computed(() => {
      return _.some(children$.value, { available: true, invalid: true })   
    })
    
    /**
     * The tab's component.
     * 
     * @type {component}
     */
    const tab$ = computed(() => {
      return form$.value.tabs$.tabs$[name.value]
    })

    // =============== METHODS ==============

    /**
     * Deactivate all other tabs and set the current one as active.
     *
     * @returns {void}
     */
    const select = () => {
      if (active.value) {
        return
      }

      tabs$.value.select(tab$.value)

      activate()
    }

    /**
     * Activate the tab.
     *
     * @returns {void}
     */
    const activate = () => {
      if (active.value) {
        return
      }

      active.value = true

      _.each(children$.value, (element$) => {
        element$.activate()
      })

      fire('activate')
    }

    /**
     * Deactivate the tab.
     *
     * @returns {void}
     */
    const deactivate = () => {
      if (!active.value) {
        return
      }

      active.value = false

      _.each(children$.value, (element$) => {
        element$.deactivate()
      })

      fire('inactivate')
    }

    /**
     * Set the component to the parent as if `refs` were used.
     * 
     * @param {component} $parent parent component
     * @param {function} assignToParent the assignToParent function for recursion
     * @returns {void}
     * @private
     */
    const assignToParent = ($parent, assignToParent) => {
      if ($parent.tabs$Array) {
        $parent.tabs$Array.push($this)
      }
      else {
        assignToParent($parent.$parent, assignToParent)
      }
    }

    /**
    * Removes the component from the parent.
    * 
    * @param {component} $parent parent component
    * @param {function} removeFromParent the removeFromParent function for recursion
    * @private
    */
    const removeFromParent = ($parent, removeFromParent) => {
      if ($parent.tabs$Array) {
        $parent.tabs$Array.splice($parent.tabs$Array.map(t$=>normalize(t$.name)).indexOf(normalize(name.value)), 1)
      }
      else {
        removeFromParent($parent.$parent, removeFromParent)
      }
    }

    // ============== WATCHERS ==============

    watch(children$, () => {
      if (!active.value) {
        return
      } 

      _.each(children$.value, (element$) => {
        element$.activate()
      })
    }, { deep: false, lazy: true })

    watch(tabLabel_, () => {
      tabLabel.value = tabLabel_.value && typeof tabLabel_.value === 'object' ? markRaw(tabLabel_.value) : tabLabel_.value
    })

    // ================ HOOKS ===============

    onMounted(() => {
      // nextTick is required because elements$
      // only available after form is mounted,
      // which is later than the tab mount
      nextTick(() => {
        if (conditions.value.length == 0) {
          return
        }

        _.each(children$.value, (element$) => {
          _.each(conditions.value, (condition) => {
            element$.conditions.push(condition)
          })
        })
      })
    })
    
    onBeforeMount(() => {
      assignToParent($this.$parent, assignToParent)
    })

    onBeforeUnmount(() => {
      removeFromParent($this.$parent, removeFromParent)
    })

    return {
      form$,
      Size,
      View,
      theme,
      elements$,
      index,
      active,
      events,
      listeners,
      children$,
      visible,
      invalid,
      classes,
      templates,
      template,
      available,
      isLabelComponent,
      tabLabel,
      tab$,
      select,
      activate,
      deactivate,
      on,
      off,
      fire,
    }
  },
}