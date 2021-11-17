import _ from 'lodash'
import Sortable from 'sortablejs'
import { computed, toRefs, nextTick, ref, watch, onMounted } from 'composition-api'

const base = function(props, context, dependencies, options)
{
  const {
    sort,
  } = toRefs(props)

  // ============ DEPENDENCIES ============

  const isDisabled = dependencies.isDisabled
  const fire = dependencies.fire
  const refreshOrderStore = dependencies.refreshOrderStore
  const value = dependencies.value
  const sorting = dependencies.sorting

  // ================ DATA ================

  /**
   * The DOM element containing list items.
   * 
   * @type {HTMLElement}
   * @private
   */
  const list = ref(null)

  /**
   * The `Sortable.js` instance.
   * 
   * @type {object}
   * @private
   */
  const sortable = ref(null)

  // ============== COMPUTED ==============

  /**
   * Whether the list is sortable. Can be enabled with [`sort`](#option-sort) option, but it will disabled if [`isDisabled`](#property-is-disabled) is `true`.
   * 
   * @type {boolean}
   */
  const isSortable = computed(() => {
    return sort.value && !isDisabled.value
  })

  // =============== METHODS ==============

  /**
   * Inits Sortable.js.
   *
   * @returns {void}
   * @private
   */
  const initSortable = () => {
    sortable.value = new Sortable(list.value, {
      handle: `[data-handle]`,
      onStart: () => {
        sorting.value = true
      },
      onEnd: handleSort,
    })
  }

  /**
   * Destroys Sortable.js.
   *
   * @returns {void}
   * @private
   */
  const destroySortable = () => {
    sortable.value.destroy()
    sortable.value = null
  }

  /**
   * Handles `sort` event.
   *
   * @param {Event} e Sortable.js event
   * @private
   */
  const handleSort = ({ oldIndex, newIndex, item }) => {
    sorting.value = false

    if (oldIndex === newIndex || isDisabled.value) {
      return
    }
    
    list.value.children[newIndex].remove()
    list.value.insertBefore(item, list.value.children[oldIndex])

    let valueClone = _.cloneDeep(value.value)

    valueClone.splice(newIndex, 0, valueClone.splice(oldIndex, 1)[0])

    value.value = valueClone

    refreshOrderStore(value.value)

    fire('sort', value.value)
  }
  
  // ============== WATCHERS ==============

  watch(isSortable, (n, o) => {
    if (n === true && o === false) {
      initSortable()
    } else if (n === false && o === true) {
      destroySortable()
    }
  }, { immediate: false })
  
  // ================ HOOKS ===============

  onMounted(() => {
    if (isSortable.value) {
      initSortable()
    }
  })

  return {
    list,
    sortable,
    isSortable,
    handleSort,
    initSortable,
    destroySortable,
  }
}

export default base