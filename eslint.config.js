// @ts-check
import antfu from '@antfu/eslint-config'

export default antfu(
  {
    type: 'lib',
  },
)
  .removeRules('ts/explicit-function-return-type')
