import fs from 'node:fs'
import { join } from 'node:path'
import process from 'node:process'
import { defineConfig } from 'vite'

let root = process.cwd()

export default defineConfig({
  plugins: [
    {
      name: 'server',
      configureServer(server) {
        root = server.config.root
        server.ws.on('connection', (socket) => {
          socket.on('message', (data) => {
            const payload = JSON.parse(data.toString()) as any
            if (payload.type === 'custom' && payload.event === 'slidev-graph-pos') {
              fs.mkdirSync(join(root, '.slidev/graph'), { recursive: true })
              fs.writeFileSync(
                join(root, `.slidev/graph/${payload.data.id}.json`),
                `${JSON.stringify(payload.data, null, 2)}\n`,
              )
            }
          })
        })
      },
      configResolved(config) {
        root = config.root
      },
      resolveId(id) {
        if (id === '/@slidev-graph-pos') {
          return id
        }
      },
      load(id) {
        if (id === '/@slidev-graph-pos') {
          const path = join(root, '.slidev/graph')
          const files = fs.existsSync(path) ? fs.readdirSync(path) : []
          return [
            'import { reactive } from "vue"',
            ...files.map((file, idx) => {
              return `import v${idx} from ${JSON.stringify(join(path, file))}`
            }),
            'const pos = reactive({',
            files.map((file, idx) => {
              return `  ${JSON.stringify(file.replace(/\.json$/, ''))}: v${idx}`
            }).join(',\n'),
            '})',

            'export default pos',

            'if (import.meta.hot) {',
            '  import.meta.hot.accept(({ default: newPos }) => {',
            '    Object.assign(pos, newPos)',
            '  })',
            '}',
          ].join('\n')
        }
      },
    },
  ],
})
