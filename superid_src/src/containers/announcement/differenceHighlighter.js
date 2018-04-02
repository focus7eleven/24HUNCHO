import { Entity, Modifier, SelectionState, convertFromRaw, convertToRaw } from 'draft-js'

export default function differenceHighlighter(contentState, history) {
  if (!history.length) return contentState

  history = history[0]
  if (!history) return contentState

  // Addition
  let rawState = convertToRaw(contentState)
  history.insert.forEach((ins) => {
    let newBlocks = rawState.blocks.slice(0, ins.position).concat(ins.content).concat(rawState.blocks.slice(ins.position + ins.content.length - 1))
    rawState.blocks = newBlocks

    contentState = convertFromRaw(rawState)

    ins.content.forEach((v) => {
      const entityKey = Entity.create('INSERT', 'IMMUTABLE', {
        text: v.text,
      })

      contentState = Modifier.applyEntity(contentState, new SelectionState({
        anchorKey: v.key,
        anchorOffset: 0,
        focusKey: v.key,
        focusOffset: v.text.length,
      }), entityKey)
    })
  })

  // Deletion
  history.delete.forEach((del) => {
    const contentBlock = contentState.getBlocksAsArray()[del - 1]

    const entityKey = Entity.create('DELETE', 'IMMUTABLE', {
      text: contentBlock.getText(),
    })

    contentState = Modifier.applyEntity(contentState, new SelectionState({
      anchorKey: contentBlock.getKey(),
      anchorOffset: 0,
      focusKey: contentBlock.getKey(),
      focusOffset: contentBlock.getText().length,
    }), entityKey)
  })

  // Replace
  history.replace.forEach((replace) => {
    const entityKey = Entity.create('REPLACE', 'IMMUTABLE', {
      text: replace.content.text,
    })

    const contentBlock = contentState.getBlocksAsArray()[replace.position - 1]

    contentState = Modifier.replaceText(contentState, new SelectionState({
      anchorKey: contentBlock.getKey(),
      anchorOffset: 0,
      focusKey: contentBlock.getKey(),
      focusOffset: contentBlock.getText().length,
    }), replace.content.text, null, entityKey)
  })

  return contentState
}
