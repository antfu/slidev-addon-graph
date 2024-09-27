<script setup lang="ts">
import type { DataItem, SavedPositions } from '..'
import { useDarkMode, useSlideContext } from '@slidev/client'
import { onClickOutside } from '@vueuse/core'
import chroma from 'chroma-js'
import { DataSet } from 'vis-data'
import { Network } from 'vis-network'
import { computed, onMounted, ref, watchEffect } from 'vue'
// @ts-expect-error virtual import
import ALL_POS from '/@slidev-graph-pos'

const props = withDefaults(
  defineProps<{
    id: string
    items: DataItem[]
    editable?: boolean
    focus?: boolean
    focusScale?: number
    clicks?: number | false
    backgroundColor?: string
  }>(),
  {
    editable: true,
    focus: false,
    clicks: false,
    focusScale: 1.5,
  },
)

const { isDark } = useDarkMode()
const { $clicks, $scale } = useSlideContext()

const container = ref<HTMLDivElement>()

const isEditing = ref(false)

const saved = computed<SavedPositions>(() => ALL_POS[props.id] || {})
const backgroundColor = computed(() => props.backgroundColor || (isDark.value ? '#050505' : '#ffff'))
const luminance = computed(() => isDark.value ? 0.7 : 0.6)

function toNode(project: DataItem, focus = false) {
  const color = chroma(project.color || '#888')
  const [_l, c, h] = color.oklch()

  const getColor = (opacity = 1) => chroma
    .oklch(luminance.value, c, h)
    .mix(backgroundColor.value, 1 - opacity)
    .hex()

  return {
    id: project.name,
    label: project.display || project.name,
    ...project,
    ...project.dashed
      ? {
          shapeProperties: { borderDashes: [2, 2] },
        }
      : {},
    font: {
      color: getColor(project.faded ? 0.75 : 1),
    },
    color: {
      border: getColor(project.faded ? 0.05 : project.dashed ? 0.2 : 0.5),
      background: getColor(project.faded ? 0.02 : project.dashed ? 0.05 : 0.05),
      highlight: {
        border: getColor((project.dashed || project.faded) ? 0.2 : 0.5),
        background: getColor(0.1),
      },
      hover: {
        border: getColor((project.dashed || project.faded) ? 0.2 : 0.5),
        background: getColor(0.07),
      },
    },
    borderWidth: focus ? 4 : 1,
    borderWidthSelected: focus ? 4 : 2,
  }
}

function toEdges(project: DataItem) {
  const color = chroma(project.color || '#333')
  const [_l, c, h] = color.oklch()

  return [
    ...(project.from || []).map(from => ({
      id: `${project.name}|from|${from}`,
      from,
      to: project.name,
      color: chroma.oklch(luminance.value, c, h).mix(backgroundColor.value, 0.8).hex(),
      arrows: {
        to: {
          enabled: true,
          type: 'arrow',
        },
      },
    })),
    ...(project.to || []).map(to => ({
      id: `${project.name}|to|${to}`,
      from: project.name,
      to,
      color: chroma.oklch(luminance.value, c, h).mix(backgroundColor.value, 0.8).hex(),
      arrows: {
        to: {
          enabled: true,
          type: 'arrow',
        },
      },
    })),
    ...(project.related || []).map(re => ({
      id: `${project.name}|related|${re}`,
      from: re,
      to: project.name,
      color: chroma.oklch(luminance.value, c, h).mix(backgroundColor.value, 0.95).hex(),
      dashes: [3, 3],
      physics: false,
    })),
  ]
}

const clicks = computed(() => {
  if (props.clicks === false)
    return 9999999
  return Math.max(0, $clicks.value - props.clicks)
})

const animationStops = computed(() => props.items.filter(p => p.clicks !== false))

defineExpose({
  count: computed(() => props.items.length),
  stops: computed(() => animationStops.value.length),
})

function getCurrentItems() {
  if (props.clicks === false)
    return props.items
  const list: DataItem[] = []
  let count = 0
  for (const item of props.items) {
    if (item.clicks === false) {
      list.push(item)
    }
    else if (item.clicks == null) {
      count += 1
      if (count <= clicks.value)
        list.push(item)
    }
    else {
      count = Math.max(count, item.clicks)
      if (item.clicks <= clicks.value)
        list.push(item)
    }
  }
  return list
}

function onDblclick() {
  if (props.editable && import.meta.hot)
    isEditing.value = !isEditing.value
}

onClickOutside(container, () => {
  isEditing.value = false
})

onMounted(() => {
  // Apply the position to the items
  props.items.forEach((p) => {
    if (saved.value.pos?.[p.name])
      Object.assign(p, saved.value.pos[p.name])
  })

  const items = getCurrentItems()
  const nodes = new DataSet(items.map(item => toNode(item)))
  const edges = new DataSet(items.flatMap(item => toEdges(item)))

  // create a network
  const network = new Network(
    container.value!,
    {
      nodes,
      edges,
    },
    {
      nodes: {
        labelHighlightBold: false,
        shape: 'box',
        margin: {
          top: 10,
          right: 10,
          bottom: 8,
          left: 10,
        },
      },
      edges: {
        smooth: {
          enabled: true,
          type: 'discrete',
          roundness: 0.5,
        },
        width: 1,
        hoverWidth: 0,
      },
      physics: {
        enabled: false,
      },
      interaction: {
        dragNodes: !!isEditing.value,
        dragView: !!isEditing.value,
        zoomView: !!isEditing.value,
        hover: true,
      },
    },
  )

  // Replace the pointer position calculation to consider the scale
  // @ts-expect-error private API
  network.interactionHandler.getPointer = function (touch: any) {
    const rect = this.canvas.frame.canvas.getBoundingClientRect()
    return {
      x: (touch.x - rect.left) / $scale.value,
      y: (touch.y - rect.top) / $scale.value,
    }
  }

  function save() {
    if (isEditing.value) {
      import.meta.hot?.send('slidev-graph-pos', {
        id: props.id,
        pos: Object.assign({}, saved.value.pos, network.getPositions()),
        view: network.getViewPosition(),
        scale: network.getScale(),
      })
    }
  }

  network.on('stabilized', () => save())
  network.on('dragEnd', () => save())

  network.on('click', (arg: { nodes: string[], pointer: { canvas: { x: number, y: number } } }) => {
    if (isEditing.value)
      return

    // Click on empty space
    // if (!arg.nodes?.length) {
    //   if (arg.pointer.canvas.x < -30)
    //     prev()
    //   else if (arg.pointer.canvas.x > 30)
    //     next()
    // }
    // Click on a node, open the link
    if (arg.nodes.length === 1) {
      const project = props.items.find(p => p.name === arg.nodes[0])
      if (project?.link)
        window.open(project.link, '_blank')
    }
  })

  network.on('hoverNode', () => {
    if (container.value)
      container.value.style.cursor = 'pointer'
  })
  network.on('blurNode', () => {
    if (container.value)
      container.value.style.cursor = 'default'
  })

  if (saved.value.view) {
    network.moveTo({
      animation: false,
      position: saved.value.view,
      scale: saved.value.scale,
    })
  }

  watchEffect(() => {
    network.setOptions({
      interaction: {
        dragNodes: isEditing.value,
        dragView: isEditing.value,
        zoomView: isEditing.value,
        hover: true,
      },
    })
  })

  let initiated = 0
  watchEffect(() => {
    const items = getCurrentItems()

    nodes.update(items.map((item, idx) => toNode(item, props.clicks !== false && idx === items.length - 1)))
    edges.update(items.flatMap(item => toEdges(item)))

    nodes.remove(nodes.getIds().filter(id => !items.some(p => p.name === id)))
    edges.remove(edges.getIds().filter(id => !items.some(p => (id as string).startsWith(`${p.name}|`))))

    // Do not move view port
    if (!props.focus) {
      return
    }

    // Fit all nodes
    if (items.length >= getCurrentItems().length || props.clicks === false) {
      // Reset previous animation, so it moves smoothly
      network.moveTo({ position: network.getViewPosition(), scale: network.getScale() })
      network.fit({
        animation: initiated
          ? {
              duration: 1500,
              easingFunction: 'easeInOutQuad',
            }
          : undefined,
      })
    }
    // Focus on the last node
    else {
      const node = items[items.length - 1]
      if (node) {
        const viewPos = network.getViewPosition()
        const distance = Math.sqrt((viewPos.x - node.x!) ** 2 + (viewPos.y - node.y!) ** 2)
        if (distance > 200 || !initiated || +clicks.value === 1) {
          // Reset previous animation, so it moves smoothly
          network.moveTo({ position: network.getViewPosition(), scale: network.getScale() })
          // Focus on the node
          network.focus(
            node.name,
            {
              scale: props.focusScale,
              animation: initiated
                ? {
                    duration: 600 + distance * 2,
                    easingFunction: 'easeInOutQuad',
                  }
                : false,
            },
          )
        }
      }
    }
    initiated += 1
  })
})
</script>

<template>
  <div
    ref="container"
    class="slidev-graph"
    :class="isEditing ? 'editing' : ''"
    @dblclick="onDblclick"
  />
</template>

<style>
.slidev-graph {
  --uno: border border-transparent min-h-20;
}
.slidev-graph div,
.slidev-graph button {
  outline: none !important;
}
.slidev-graph.editing {
  --uno: border border-dashed border-gray/50 rounded;
}
</style>
