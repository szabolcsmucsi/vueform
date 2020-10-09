import { createLocalVue } from '@vue/test-utils'
import { createForm } from 'test-helpers'
import flushPromises from 'flush-promises'

const Vue = createLocalVue()

describe('Children Validation Mixin', () => {
  it('should be `dirty` if any child is dirty', async () => {
    let form = createForm({
      schema: {
        a: {
          type: 'object',
          schema: {
            b: {
              type: 'text'
            },
            c: {
              type: 'text',
            },
          }
        }
      }
    })

    let object = form.findComponent({ name: 'ObjectElement' })

    expect(object.vm.dirty).toBe(false)

    await Vue.nextTick()
    
    form.findAllComponents({ name: 'TextElement' }).at(0).get('input').setValue('aaa')
      
    await Vue.nextTick()
    
    expect(object.vm.dirty).toBe(true)
  })

  it('should be `invalid` if any element is invalid', async () => {
    let form = createForm({
      schema: {
        a: {
          type: 'object',
          schema: {
            b: {
              type: 'text',
              rules: 'required'
            },
            c: {
              type: 'text',
            },
          }
        }
      }
    })

    let object = form.findComponent({ name: 'ObjectElement' })

    expect(object.vm.invalid).toBe(false)

    await Vue.nextTick()
    
    form.findAllComponents({ name: 'TextElement' }).at(0).vm.validate()
      
    await Vue.nextTick()
    
    expect(object.vm.invalid).toBe(true)
  })

  it('should be `debouncing` & `busy` if any element is debouncing', async () => {
    let form = createForm({
      schema: {
        a: {
          type: 'object',
          schema: {
            b: {
              type: 'text',
              rules: 'required:debounce=3000'
            },
            c: {
              type: 'text',
            },
          }
        }
      }
    })

    let object = form.findComponent({ name: 'ObjectElement' })

    expect(object.vm.debouncing).toBe(false)
    expect(object.vm.busy).toBe(false)

    await Vue.nextTick()

    form.findAllComponents({ name: 'TextElement' }).at(0).vm.validate()
      
    await Vue.nextTick()

    expect(object.vm.debouncing).toBe(true)
    expect(object.vm.busy).toBe(true)
  })

  it('should be `pending` and `busy` if any element is pending', async () => {
    let form = createForm({
      schema: {
        a: {
          type: 'object',
          schema: {
            b: {
              type: 'text',
              rules: 'unique'
            },
            c: {
              type: 'text',
            },
          }
        }
      }
    })

    let object = form.findComponent({ name: 'ObjectElement' })

    expect(object.vm.pending).toBe(false)
    expect(object.vm.busy).toBe(false)

    await Vue.nextTick()
    
    form.findAllComponents({ name: 'TextElement' }).at(0).vm.validate()
      
    await Vue.nextTick()

    expect(object.vm.pending).toBe(true)
    expect(object.vm.busy).toBe(true)
  })

  it('should be `validated` only if all elements are validated', async () => {
    let form = createForm({
      schema: {
        a: {
          type: 'object',
          schema: {
            b: {
              type: 'text',
              rules: 'required'
            },
            c: {
              type: 'text',
            },
          }
        }
      }
    })

    let object = form.findComponent({ name: 'ObjectElement' })

    expect(object.vm.validated).toBe(false)

    await Vue.nextTick()
    
    let b = form.findAllComponents({ name: 'TextElement' }).at(0)

    b.get('input').setValue('aaa')
    b.vm.validate()
    await flushPromises()
      
    await Vue.nextTick()
    
    expect(object.vm.validated).toBe(true)
  })

  it('should collect element errors in `errors`', async () => {
    let form = createForm({
      schema: {
        a: {
          type: 'object',
          schema: {
            b: {
              type: 'text',
              rules: 'required'
            },
            c: {
              type: 'text',
            },
          }
        }
      }
    })

    let object = form.findComponent({ name: 'ObjectElement' })

    expect(object.vm.errors.length).toBe(0)

    await Vue.nextTick()
    
    let b = form.findAllComponents({ name: 'TextElement' }).at(0)

    b.vm.validate()
    
    await Vue.nextTick()
    
    expect(object.vm.errors.length).toBe(1)
  })

  it('should leave out unavailable element errors in `errors`', async () => {
    let form = createForm({
      schema: {
        a: {
          type: 'object',
          schema: {
            b: {
              type: 'text',
              rules: 'required',
            },
            c: {
              type: 'text',
              rules: 'required',
              conditions: [
                ['a.b', 'aaa']
              ]
            },
          }
        }
      }
    })

    let object = form.findComponent({ name: 'ObjectElement' })

    expect(object.vm.errors.length).toBe(0)

    await Vue.nextTick()
      
    let b = form.findAllComponents({ name: 'TextElement' }).at(0)
    let c = form.findAllComponents({ name: 'TextElement' }).at(1)

    b.vm.validate()
    c.vm.validate()
    
    await Vue.nextTick()

    expect(object.vm.errors.length).toBe(1)
  })

  it('should `validate` children', async () => {
    let form = createForm({
      schema: {
        a: {
          type: 'object',
          schema: {
            b: {
              type: 'text',
              rules: 'required',
            },
            c: {
              type: 'text',
              rules: 'required',
            },
          }
        }
      }
    })

    let object = form.findComponent({ name: 'ObjectElement' })

    expect(object.vm.errors.length).toBe(0)

    await Vue.nextTick()

    object.vm.validate()
    
    await Vue.nextTick()
    
    expect(object.vm.errors.length).toBe(2)
  })

  it('should not have `error`', async () => {
    let form = createForm({
      schema: {
        a: {
          type: 'object',
          schema: {
            b: {
              type: 'text',
              rules: 'required',
            },
            c: {
              type: 'text',
              rules: 'required',
            },
          }
        }
      }
    })

    let object = form.findComponent({ name: 'ObjectElement' })

    expect(object.vm.error).toBe(null)
  })
})